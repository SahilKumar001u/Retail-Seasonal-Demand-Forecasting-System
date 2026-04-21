# Deployment Guide

This guide explains how to deploy the **Retail Seasonal Demand Forecasting System** using Docker and Docker Compose. It includes instructions for local deployment and cloud deployment (e.g., AWS EC2).

## Prerequisites
- **Docker** installed
- **Docker Compose** installed

## Local Deployment

1. **Clone or navigate to the repository folder:**
   Ensure you are in the root directory containing `docker-compose.yml`.

2. **Start the services:**
   Run the following command to build the images and start the containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the Application:**
   - **Frontend UI**: Open your browser and go to `http://localhost`
   - **Backend API Docs (Swagger)**: Go to `http://localhost:8000/docs`
   
   *(Note: The frontend automatically routes its `/api` calls to the backend via Nginx, avoiding any CORS issues).*

4. **Stop the services:**
   ```bash
   docker-compose down
   ```
   *Your database data and uploaded datasets will persist in Docker volumes (`postgres_data` and `backend_data`).*

## AWS EC2 Deployment

To deploy this on AWS EC2, follow these steps:

1. **Launch an EC2 Instance:**
   - Use an Ubuntu Server AMI (22.04 LTS or newer).
   - Instance Type: `t3.small` or `t3.medium` (recommended due to Machine Learning memory requirements for statsmodels).
   - Configure Security Group:
     - Allow SSH (Port 22)
     - Allow HTTP (Port 80)
     - Allow Custom TCP (Port 8000) if you want direct API access (optional).

2. **SSH into your EC2 Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Docker & Docker Compose:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   # Log out and log back in for group changes to take effect
   ```

4. **Transfer your Code:**
   Clone your Git repository into the EC2 instance, or copy the files via `scp`.

5. **Start the Application:**
   Navigate into your project folder and run:
   ```bash
   docker-compose up --build -d
   ```

6. **Access:**
   Navigate to your EC2 instance's **Public IPv4 address** or DNS name in your web browser.

## Troubleshooting

- **Checking logs for the backend (FastAPI/ML models):**
  ```bash
  docker logs retail_backend -f
  ```
- **Checking logs for the frontend (Nginx):**
  ```bash
  docker logs retail_frontend -f
  ```
- **Checking database logs:**
  ```bash
  docker logs retail_db -f
  ```
- **Clearing persistent data (Reset everything):**
  If you need to wipe the database and the uploaded files:
  ```bash
  docker-compose down -v
  ```
