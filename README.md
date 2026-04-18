# GCP Event-Driven E-Commerce Architecture 🛒☁️

A full-stack, serverless, event-driven e-commerce application built and deployed entirely on Google Cloud Platform (GCP).

This project demonstrates a modern microservices architecture using Cloud Run for compute, Pub/Sub for asynchronous event messaging, and BigQuery for real-time data warehousing. It includes automated infrastructure provisioning via shell scripts.

---

## 🏗️ Architecture

<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/d12a1774-425a-4e9a-9dea-998da5b11074" />


---
## 🧩 Core Components

### Frontend (React/Vite)
A dynamic e-commerce storefront with a shopping cart. It includes a smart auto-discovery mechanism with exponential backoff to automatically locate and securely connect to its sibling backend service.

### Backend API (Python/Flask)
A serverless REST API that receives orders and publishes them as events to Pub/Sub.

### Event Router (Cloud Pub/Sub)
The central nervous system of the platform. It decouples the frontend from downstream processing using asynchronous event delivery.

### Data Warehouse (BigQuery)
Native Pub/Sub-to-BigQuery subscriptions stream raw order data directly into queryable columns without requiring intermediary Dataflow jobs.

---


## 🚀 Quick Start

### Prerequisites

- ** A Google Cloud Platform (GCP) account.

- ** Google Cloud CLI (gcloud) installed and authenticated.

- ** Billing enabled on your GCP project.

### Deployment

#### 1) Clone this repository
```bash
git clone [https://github.com/cloudrockpl/gcp-event-driven-ecommerce.git](https://github.com/cloudrockpl/gcp-event-driven-ecommerce.git)

cd gcp-event-driven-ecommerce
```

#### 2) Set your active GCP project

```bash
gcloud config set project YOUR_PROJECT_ID
```

#### 3) Make the deployment script executable and run it

```bash
chmod +x deploy-fullstack.sh
./deploy-fullstack.sh
```


Once completed, the script will output the live public URL for your React Frontend. Click it to start placing orders!
---

## 🧹 Clean Up

To avoid incurring unwanted charges, tear down the entire architecture when you are finished testing:

```bash
chmod +x cleanup-fullstack.sh
./cleanup-fullstack.sh
```

> **Note:** This cleanup script safely deletes the Cloud Run services, Pub/Sub topics and subscriptions, Artifact Registry repositories, BigQuery datasets, and custom IAM service accounts created by the deployment script.

---

## 📁 Repository Structure

```text
.
├── App.jsx                 # React UI source code
├── app.py                  # Flask backend source code
├── deploy-fullstack.sh     # Master deployment script (IaC)
├── cleanup-fullstack.sh    # Master teardown script
└── README.md               # Project documentation
```

---


## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Python
- Flask
- Gunicorn

### GCP Services
- Cloud Run
- Cloud Pub/Sub
- BigQuery
- Artifact Registry
- Cloud Build
- IAM

---
