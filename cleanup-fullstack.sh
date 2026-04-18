#!/bin/bash
# ==============================================================================
# Full Stack Clean-up: React Frontend, Python Microservices, Pub/Sub & BigQuery
# Run this to delete all resources created by deploy-fullstack.sh
# ==============================================================================

# We do not use "set -e" here to ensure the script continues attempting 
# to delete resources even if one of them fails or was already deleted.

# Configuration (Matches deploy-fullstack.sh)
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

BQ_DATASET="order_data"

echo "Starting full stack cleanup for Project: $PROJECT_ID in Region: $REGION"
echo "================================================================="

# 1. Delete Cloud Run Services
echo "1. Cleaning up Cloud Run Services..."
for svc in order-service inventory-service billing-service shipping-service store-frontend; do
    echo "   Deleting $svc..."
    gcloud run services delete $svc --region $REGION --quiet || echo "   [Skipped] $svc not found."
done

# 2. Delete Pub/Sub Subscriptions
echo "2. Cleaning up Pub/Sub Subscriptions..."
for sub in inventory-sub billing-sub shipping-sub bq-orders-sub; do
    echo "   Deleting $sub..."
    gcloud pubsub subscriptions delete $sub --quiet || echo "   [Skipped] $sub not found."
done

# 3. Delete Pub/Sub Topics (Main and DLQs)
echo "3. Cleaning up Pub/Sub Topics..."
echo "   Deleting $TOPIC_ID..."
gcloud pubsub topics delete $TOPIC_ID --quiet || echo "   [Skipped] $TOPIC_ID not found."

for svc in inventory billing shipping; do
    echo "   Deleting ${svc}-dlq..."
    gcloud pubsub topics delete ${svc}-dlq --quiet || echo "   [Skipped] ${svc}-dlq not found."
done

# 4. Delete Artifact Registry Repository (Also deletes all Docker images inside)
echo "4. Cleaning up Artifact Registry..."
echo "   Deleting repository $REPO_NAME..."
gcloud artifacts repositories delete $REPO_NAME --location=$REGION --quiet || echo "   [Skipped] Repository $REPO_NAME not found."

# 5. Delete BigQuery Dataset (Recursively deletes tables inside)
echo "5. Cleaning up BigQuery Integration..."
echo "   Deleting dataset $BQ_DATASET and all tables within it..."
bq rm -r -f -d $PROJECT_ID:$BQ_DATASET || echo "   [Skipped] Dataset $BQ_DATASET not found."

# 6. Remove Project-level IAM Bindings
echo "6. Cleaning up Project IAM Bindings..."
echo "   Removing Cloud Run SA publisher role..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$RUN_SA_EMAIL" \
    --role="roles/pubsub.publisher" --quiet > /dev/null 2>&1 || true

echo "   Removing Cloud Build SA AR writer role..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CLOUDBUILD_SA" \
    --role="roles/artifactregistry.writer" --quiet > /dev/null 2>&1 || true

echo "   Removing Compute SA AR writer role..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/artifactregistry.writer" --quiet > /dev/null 2>&1 || true

echo "   Removing Pub/Sub Service Agent subscriber role..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="$PUBSUB_SA" \
    --role="roles/pubsub.subscriber" --quiet > /dev/null 2>&1 || true

echo "   Removing Pub/Sub Service Agent BigQuery Editor role..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="$PUBSUB_SA" \
    --role="roles/bigquery.dataEditor" --quiet > /dev/null 2>&1 || true

# 7. Delete Custom Service Accounts
echo "7. Cleaning up Service Accounts..."
echo "   Deleting $SA_NAME..."
gcloud iam service-accounts delete $SA_EMAIL --quiet || echo "   [Skipped] SA $SA_NAME not found."

echo "   Deleting $RUN_SA_NAME..."
gcloud iam service-accounts delete $RUN_SA_EMAIL --quiet || echo "   [Skipped] SA $RUN_SA_NAME not found."

# 8. Clean up local directories
echo "8. Cleaning up local generated directories..."
rm -rf backend/ frontend/ || echo "   [Skipped] Local folders already removed."

echo "================================================================="
echo "Full Stack Cleanup Complete!"
echo "================================================================="
