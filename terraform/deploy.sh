#!/bin/bash

# Deploy Invoice Forge with optional subdirectory support
# Usage: ./deploy.sh [local|remote] [subdirectory_name]
#
# Examples:
#   ./deploy.sh local                    # Deploy locally at root (http://localhost:8082)
#   ./deploy.sh local my-app             # Deploy locally at /my-app (http://localhost:8082/my-app)
#   ./deploy.sh remote                   # Deploy remotely at root (http://server:8082)
#   ./deploy.sh remote invoice-forge     # Deploy remotely at /invoice-forge (http://server:8082/invoice-forge)

set -e  # Exit on any error

# Default values
ENVIRONMENT="${1:-local}"
SUBDIRECTORY="${2:-}"  # Empty default means root deployment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate environment parameter
if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "remote" ]]; then
    echo "❌ Error: Environment must be 'local' or 'remote'"
    echo "Usage: $0 [local|remote] [subdirectory_name]"
    exit 1
fi

# Function to check if terraform.tfvars exists for remote deployment
check_remote_config() {
    if [[ ! -f "$SCRIPT_DIR/terraform.tfvars" ]]; then
        echo "❌ Error: terraform.tfvars not found for remote deployment"
        echo ""
        echo "Please create terraform.tfvars with the following variables:"
        echo "  droplet_ip = \"YOUR_SERVER_IP\""
        echo "  private_key_path = \"/path/to/your/private/key\""
        echo "  api_url_remote = \"http://YOUR_SERVER_IP:8083\""
        echo ""
        exit 1
    fi
}

# Function to deploy locally
deploy_local() {
    echo "🚀 Deploying Invoice Forge locally..."
    if [[ -z "$SUBDIRECTORY" ]]; then
        echo "📍 Frontend will be accessible at: http://localhost:8082"
        echo "📍 Deployment: Root (no subdirectory)"
    else
        echo "📍 Frontend will be accessible at: http://localhost:8082/$SUBDIRECTORY"
        echo "📍 Deployment: Subdirectory (/$SUBDIRECTORY)"
    fi
    echo "📍 Backend API will be accessible at: http://localhost:8083"
    echo "🏗️  Build platform: linux/arm64 (local)"
    echo ""

    # Clean up previous deployment
    echo "🧹 Cleaning up previous deployment..."
    terraform destroy -auto-approve 2>/dev/null || true
    echo ""

    # Re-initialize terraform
    echo "🔧 Re-initializing Terraform..."
    terraform init
    echo ""

    # Deploy with local configuration
    echo "🚀 Starting deployment..."
    if [[ -z "$SUBDIRECTORY" ]]; then
        # Root deployment (no subdirectory)
        terraform apply -auto-approve \
            -var="environment=local" \
            -var="build_platform=linux/arm64" \
            -var="vite_base=/" \
            -var="vite_basename=/" \
            -var="subdirectory_name=" \
            -var="api_url_local=http://localhost:8083"
    else
        # Subdirectory deployment
        terraform apply -auto-approve \
            -var="environment=local" \
            -var="build_platform=linux/arm64" \
            -var="vite_base=/$SUBDIRECTORY/" \
            -var="vite_basename=/$SUBDIRECTORY" \
            -var="subdirectory_name=$SUBDIRECTORY" \
            -var="api_url_local=http://localhost:8083"
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Local deployment successful!"
        echo ""
        
        # Show terraform outputs
        echo "📊 Deployment Information:"
        echo "=========================="
        terraform output
        echo ""
        
        echo "🌐 Access your application:"
        if [[ -z "$SUBDIRECTORY" ]]; then
            echo "   Frontend: http://localhost:8082"
        else
            echo "   Frontend: http://localhost:8082/$SUBDIRECTORY"
        fi
        echo "   Backend API: http://localhost:8083"
        echo "   API Docs: http://localhost:8083/docs"
        echo ""
        echo "🔧 Useful commands:"
        echo "   Check containers: docker ps"
        echo "   View frontend logs: docker logs invoice-forge-frontend"
        echo "   View backend logs: docker logs invoice-forge-backend"
        echo "   Stop services: terraform destroy -auto-approve"
        echo ""
    else
        echo "❌ Local deployment failed. Check the output above for errors."
        exit 1
    fi
}

# Function to deploy remotely
deploy_remote() {
    echo "🚀 Deploying Invoice Forge remotely..."
    
    # Read server IP from terraform.tfvars
    SERVER_IP=$(grep -E '^droplet_ip\s*=' "$SCRIPT_DIR/terraform.tfvars" | sed 's/.*=\s*"\([^"]*\)".*/\1/')
    
    if [[ -z "$SERVER_IP" ]]; then
        echo "❌ Error: Could not read droplet_ip from terraform.tfvars"
        exit 1
    fi
    
    if [[ -z "$SUBDIRECTORY" ]]; then
        echo "📍 Frontend will be accessible at: http://$SERVER_IP:8082"
        echo "📍 Deployment: Root (no subdirectory)"
    else
        echo "📍 Frontend will be accessible at: http://$SERVER_IP:8082/$SUBDIRECTORY"
        echo "📍 Deployment: Subdirectory (/$SUBDIRECTORY)"
    fi
    echo "📍 Backend API will be accessible at: http://$SERVER_IP:8083"
    echo "🏗️  Build platform: linux/amd64 (remote)"
    echo ""

    # Clean up previous deployment
    echo "🧹 Cleaning up previous deployment..."
    terraform destroy -auto-approve 2>/dev/null || true
    echo ""

    # Re-initialize terraform
    echo "🔧 Re-initializing Terraform..."
    terraform init
    echo ""

    # Deploy with remote configuration
    echo "🚀 Starting deployment..."
    if [[ -z "$SUBDIRECTORY" ]]; then
        # Root deployment (no subdirectory)
        terraform apply -auto-approve \
            -var="environment=remote" \
            -var="build_platform=linux/amd64" \
            -var="vite_base=/" \
            -var="vite_basename=/" \
            -var="subdirectory_name="
    else
        # Subdirectory deployment
        terraform apply -auto-approve \
            -var="environment=remote" \
            -var="build_platform=linux/amd64" \
            -var="vite_base=/$SUBDIRECTORY/" \
            -var="vite_basename=/$SUBDIRECTORY" \
            -var="subdirectory_name=$SUBDIRECTORY"
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Remote deployment successful!"
        echo ""
        
        # Show terraform outputs
        echo "📊 Deployment Information:"
        echo "=========================="
        terraform output
        echo ""
        
        echo "🌐 Access your application:"
        if [[ -z "$SUBDIRECTORY" ]]; then
            echo "   Frontend: http://$SERVER_IP:8082"
        else
            echo "   Frontend: http://$SERVER_IP:8082/$SUBDIRECTORY"
        fi
        echo "   Backend API: http://$SERVER_IP:8083"
        echo "   API Docs: http://$SERVER_IP:8083/docs"
        echo ""
        echo "🔧 Useful commands:"
        echo "   SSH to server: ssh -i \$(grep private_key_path terraform.tfvars | cut -d'\"' -f2) root@$SERVER_IP"
        echo "   Check containers: ssh root@$SERVER_IP 'docker ps'"
        echo "   View logs: ssh root@$SERVER_IP 'docker logs invoice-forge-frontend'"
        echo "   Stop services: terraform destroy -auto-approve"
        echo ""
        echo "💡 Note: Make sure your server firewall allows ports 8082 and 8083"
    else
        echo "❌ Remote deployment failed. Check the output above for errors."
        exit 1
    fi
}

# Main execution
echo "Invoice Forge Deployment Script"
echo "==============================="
echo "Environment: $ENVIRONMENT"
if [[ -z "$SUBDIRECTORY" ]]; then
    echo "Deployment: Root (no subdirectory)"
else
    echo "Subdirectory: /$SUBDIRECTORY"
fi
echo ""

# Change to terraform directory
cd "$SCRIPT_DIR"

# Note: Terraform initialization is now handled within each deployment function
# to ensure clean state after destroy operations

# Execute deployment based on environment
case "$ENVIRONMENT" in
    "local")
        deploy_local
        ;;
    "remote")
        check_remote_config
        deploy_remote
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac 