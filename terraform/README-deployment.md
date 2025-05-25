# Invoice Forge Deployment Guide

This guide explains how to deploy Invoice Forge using the parameterized deployment script.

## Prerequisites

- Docker installed and running
- Terraform installed
- For remote deployment: SSH access to your server

## Usage

The deployment script supports both local and remote deployments with customizable subdirectories.

### Script Syntax

```bash
./deploy-subdirectory.sh [local|remote] [subdirectory_name]
```

### Examples

#### Local Deployment

```bash
# Deploy locally at http://localhost:8082/invoice-forge (default)
./deploy-subdirectory.sh local

# Deploy locally at http://localhost:8082/my-app
./deploy-subdirectory.sh local my-app

# Deploy locally at http://localhost:8082/accounting
./deploy-subdirectory.sh local accounting
```

#### Remote Deployment

First, create `terraform/terraform.tfvars`:

```hcl
droplet_ip = "YOUR_SERVER_IP"
private_key_path = "/path/to/your/private/key"
api_url_remote = "http://YOUR_SERVER_IP:8083"
```

Then deploy:

```bash
# Deploy remotely at http://YOUR_SERVER_IP:8082/invoice-forge (default)
./deploy-subdirectory.sh remote

# Deploy remotely at http://YOUR_SERVER_IP:8082/my-app
./deploy-subdirectory.sh remote my-app
```

## What the Script Does

### Local Deployment
1. Cleans up any previous deployment (`terraform destroy`)
2. Re-initializes Terraform for clean state
3. Builds Docker containers locally using buildx for **linux/arm64** platform
4. Configures frontend with the specified subdirectory path
5. Starts containers with Docker networking
6. Makes frontend accessible at `http://localhost:8082/[subdirectory]`
7. Makes backend API accessible at `http://localhost:8083`
8. Shows deployment information via `terraform output`

### Remote Deployment
1. Cleans up any previous deployment (`terraform destroy`)
2. Re-initializes Terraform for clean state
3. Builds Docker containers locally for **linux/amd64** platform
4. Saves and transfers container images to remote server
5. Loads and starts containers on remote server
6. Makes frontend accessible at `http://[server-ip]:8082/[subdirectory]`
7. Makes backend API accessible at `http://[server-ip]:8083`
8. Shows deployment information via `terraform output`

## Configuration Details

The script automatically configures:
- **Build Platform**: `linux/arm64` for local, `linux/amd64` for remote
- **Clean Deployment**: Destroys previous state and re-initializes Terraform
- `VITE_BASE`: Sets the build base path (e.g., `/invoice-forge/`)
- `VITE_BASENAME`: Sets the React Router basename (e.g., `/invoice-forge`)
- `VITE_API_URL`: Points to the appropriate backend API URL
- **Nginx routing**: Handles subdirectory serving and SPA routing
- **Output Display**: Shows deployment information and useful commands

## Useful Commands

### Check Deployment Status
```bash
# Local
docker ps
docker logs invoice-forge-frontend
docker logs invoice-forge-backend

# Remote
ssh root@YOUR_SERVER_IP 'docker ps'
ssh root@YOUR_SERVER_IP 'docker logs invoice-forge-frontend'
```

### Stop Services
```bash
cd terraform
terraform destroy -auto-approve
```

### Access Points

After successful deployment:

- **Frontend**: `http://[host]:8082/[subdirectory]`
- **Backend API**: `http://[host]:8083`
- **API Documentation**: `http://[host]:8083/docs`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 8082 and 8083 are available
2. **Docker not running**: Ensure Docker daemon is started
3. **Remote SSH issues**: Verify SSH key permissions and server access
4. **Firewall blocking**: Ensure server firewall allows ports 8082 and 8083

### Debug Commands

```bash
# Check if containers are running
docker ps

# View container logs
docker logs invoice-forge-frontend
docker logs invoice-forge-backend

# Test API connectivity
curl http://localhost:8083/version

# Check network connectivity
docker network ls
docker network inspect invoice-forge-network
```

## Advanced Configuration

For more advanced configurations, you can directly use terraform commands:

```bash
cd terraform

# Custom deployment with specific variables
terraform apply -auto-approve \
  -var="environment=local" \
  -var="vite_base=/my-custom-path/" \
  -var="vite_basename=/my-custom-path" \
  -var="frontend_port=3000" \
  -var="backend_port=3001"
``` 