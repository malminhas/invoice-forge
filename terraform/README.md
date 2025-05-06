# Terraform Infrastructure for Invoice Forge

This directory contains Terraform configuration to build and run Docker containers for both the frontend and backend of the Invoice Forge project.

## Prerequisites
- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [Docker](https://docs.docker.com/get-docker/)
- Dockerfiles in both `frontend/` and `backend/` directories

## Usage

1. **Navigate to the terraform directory:**
   ```sh
   cd terraform
   ```

2. **Initialize Terraform:**
   ```sh
   terraform init
   ```

3. **Review the plan:**
   ```sh
   terraform plan
   ```

4. **Apply the configuration:**
   ```sh
   terraform apply
   ```
   This will build Docker images and start containers for both frontend and backend.

5. **Access the services:**
   - Frontend: [http://localhost:8010](http://localhost:8010) (default)
   - Backend: [http://localhost:8000](http://localhost:8000) (default)

## Customization
- You can override default ports and network name by passing variables:
  ```sh
  terraform apply -var="backend_port=9000" -var="frontend_port=9001"
  ```

## Notes
- Ensure you have a `Dockerfile` in both the `frontend/` and `backend/` directories.
- The containers will be connected to a custom Docker network for easy communication.
- Environment variables can be customized in the Terraform files as needed. 