#!/bin/bash
# ==============================================================================
# Full Stack Deployment: React Frontend, Python Microservices, Pub/Sub & BigQuery
# ==============================================================================
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
REGION="us-central1"
REPO_NAME="ecommerce-repo"

TOPIC_ID="order-placed"
SA_NAME="pubsub-invoker"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
RUN_SA_NAME="cloudrun-app-sa"
RUN_SA_EMAIL="$RUN_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
PUBSUB_SA="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/order-backend:latest"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/store-frontend:latest"

# BigQuery Configuration
BQ_DATASET="order_data"
BQ_TABLE="raw_orders"

echo "Deploying Full Stack to Project: $PROJECT_ID in Region: $REGION"
echo "================================================================="

# 1. Enable Required APIs
echo "[1/8] Enabling necessary GCP APIs..."
gcloud services enable run.googleapis.com pubsub.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com bigquery.googleapis.com

# 2. Setup Artifact Registry
echo "[2/8] Setting up Artifact Registry..."
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Full Stack E-commerce" || echo "Repository already exists"

# Grant Cloud Build SA permission to push to Artifact Registry
echo "Granting Cloud Build Service Accounts Artifact Registry Writer roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUDBUILD_SA" --role="roles/artifactregistry.writer" --quiet > /dev/null
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$COMPUTE_SA" --role="roles/artifactregistry.writer" --quiet > /dev/null

echo "Waiting 15 seconds for IAM permissions to propagate before building..."
sleep 15

# =========================================================
# 3. BACKEND BUILD & DEPLOYMENT
# =========================================================
echo "[3/8] Preparing Backend (Python/Flask)..."

# Create a clean directory for the backend
mkdir -p backend

# Ensure app.py exists before proceeding
if [ -f app.py ]; then
    cp app.py backend/app.py
elif [ ! -f backend/app.py ]; then
    echo "ERROR: app.py not found! Please place app.py in the same directory as this script."
    exit 1
fi

cat <<EOF > backend/requirements.txt
Flask==3.0.3
Flask-Cors==4.0.0
google-cloud-pubsub==2.21.0
gunicorn==22.0.0
requests==2.31.0
EOF

cat <<EOF > backend/Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
COPY app.py .
CMD exec gunicorn --bind :\$PORT --workers 1 --threads 8 --timeout 0 app:app
EOF

echo "Building Backend Docker image..."
# Notice we now point gcloud builds to the backend/ folder directly
gcloud builds submit --tag $BACKEND_IMAGE backend/

echo "Setting up Cloud Run Service Account..."
gcloud iam service-accounts create $RUN_SA_NAME --display-name "Cloud Run App SA" || echo "SA already exists"

echo "Waiting 10 seconds for Cloud Run service account to propagate..."
sleep 10

# Give Cloud Run SA permission to publish to Pub/Sub
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$RUN_SA_EMAIL" \
    --role="roles/pubsub.publisher" \
    --quiet

echo "[4/8] Deploying Cloud Run Services..."
echo "Deploying the Public Order Service..."
gcloud run deploy order-service \
    --image $BACKEND_IMAGE \
    --service-account $RUN_SA_EMAIL \
    --set-env-vars SERVICE_NAME=order,PROJECT_ID=$PROJECT_ID,TOPIC_ID=$TOPIC_ID \
    --region $REGION \
    --allow-unauthenticated \
    --quiet

# Deploy the private subscriber services (No unauthenticated access allowed)
for svc in inventory billing shipping; do
    echo "Deploying Private Subscriber Service: $svc..."
    gcloud run deploy $svc-service \
        --image $BACKEND_IMAGE \
        --service-account $RUN_SA_EMAIL \
        --set-env-vars SERVICE_NAME=$svc \
        --region $REGION \
        --no-allow-unauthenticated \
        --quiet
done

# =========================================================
# 5. PUB/SUB SETUP & IAM CONFIGURATION
# =========================================================
echo "[5/8] Configuring Pub/Sub Topics, Subscriptions, and Security..."
gcloud iam service-accounts create $SA_NAME --display-name "Pub/Sub Invoker SA" || echo "SA already exists"

echo "Waiting 10 seconds for Pub/Sub Invoker service account to propagate..."
sleep 10

for svc in inventory billing shipping; do
    gcloud run services add-iam-policy-binding $svc-service \
        --region=$REGION \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/run.invoker" \
        --quiet
done

echo "Creating Main Topic and Dead-Letter Topics..."
gcloud pubsub topics create $TOPIC_ID || echo "Topic exists"

for svc in inventory billing shipping; do
    gcloud pubsub topics create ${svc}-dlq || echo "DLQ exists"
done

echo "Configuring Pub/Sub Service Agent IAM..."
gcloud beta services identity create --service=pubsub.googleapis.com --project=$PROJECT_ID

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="$PUBSUB_SA" \
    --role="roles/pubsub.subscriber" \
    --condition=None \
    --quiet

for svc in inventory billing shipping; do
    gcloud pubsub topics add-iam-policy-binding ${svc}-dlq \
        --member="$PUBSUB_SA" \
        --role="roles/pubsub.publisher" \
        --quiet
done

echo "Creating Fan-out Push Subscriptions..."
for svc in inventory billing shipping; do
    ENDPOINT=$(gcloud run services describe $svc-service --region $REGION --format='value(status.url)')/process
    
    gcloud pubsub subscriptions create ${svc}-sub \
        --topic=$TOPIC_ID \
        --push-endpoint=$ENDPOINT \
        --push-auth-service-account=$SA_EMAIL \
        --dead-letter-topic=${svc}-dlq \
        --max-delivery-attempts=5 \
        --min-retry-delay=10s \
        --max-retry-delay=600s || echo "Subscription exists, skipping creation."
done

# =========================================================
# 6. BIGQUERY INTEGRATION
# =========================================================
echo "[6/8] Setting up BigQuery dataset and table for order ingestion..."
bq --location=$REGION mk -d \
    --description "Dataset for Pub/Sub ingested orders" \
    $PROJECT_ID:$BQ_DATASET || echo "Dataset exists"

bq mk -t \
    --schema "order_id:STRING,item:STRING,price:FLOAT,fail_billing:BOOLEAN,subscription_name:STRING,message_id:STRING,publish_time:TIMESTAMP,attributes:JSON" \
    --description "Parsed orders from Pub/Sub" \
    $PROJECT_ID:$BQ_DATASET.$BQ_TABLE || echo "Table exists"

echo "Granting Pub/Sub SA permission to write to BigQuery..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="$PUBSUB_SA" \
    --role="roles/bigquery.dataEditor" \
    --quiet

echo "Creating BigQuery Subscription with table schema mapping..."
gcloud pubsub subscriptions create bq-orders-sub \
    --topic=$TOPIC_ID \
    --bigquery-table=$PROJECT_ID.$BQ_DATASET.$BQ_TABLE \
    --use-table-schema \
    --write-metadata \
    || echo "BQ Subscription exists, skipping creation."

# Get backend URL for Frontend
ORDER_URL=$(gcloud run services describe order-service --region $REGION --format='value(status.url)')

# =========================================================
# 7. FRONTEND BUILD & DEPLOYMENT
# =========================================================
echo "[7/8] Preparing Frontend (React/Vite)..."

mkdir -p frontend/src
# Copy the App.jsx from your local directory into the build folder
if [ -f App.jsx ]; then
    cp App.jsx frontend/src/App.jsx
elif [ ! -f frontend/src/App.jsx ]; then
    echo "ERROR: App.jsx not found! Please place App.jsx in the same directory as this script."
    exit 1
fi

cat << 'EOF' > frontend/package.json
{
  "name": "ecommerce-ui",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": { "build": "vite build" },
  "dependencies": {
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}
EOF

cat << 'EOF' > frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
EOF

cat << 'EOF' > frontend/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tech Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat << 'EOF' > frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat << 'EOF' > frontend/Dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static files using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

echo "[8/8] Building and Deploying Frontend via Cloud Build & Cloud Run..."
gcloud builds submit --tag $FRONTEND_IMAGE frontend/

gcloud run deploy store-frontend \
    --image $FRONTEND_IMAGE \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --quiet

FRONTEND_URL=$(gcloud run services describe store-frontend --region $REGION --format='value(status.url)')

echo "================================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================================="
echo "🛠️  Backend Order API: $ORDER_URL/place-order"
echo "🌐 Frontend Store UI: $FRONTEND_URL"
echo "================================================================="
