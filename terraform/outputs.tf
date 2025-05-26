output "frontend_url" {
  description = "URL to access the frontend"
  value = var.environment == "local" ? (
    var.subdirectory_name != "" ? 
    "http://localhost:${var.frontend_port}/${var.subdirectory_name}" : 
    "http://localhost:${var.frontend_port}"
  ) : (
    var.subdirectory_name != "" ? 
    "http://${var.droplet_ip}:${var.frontend_port}/${var.subdirectory_name}" : 
    "http://${var.droplet_ip}:${var.frontend_port}"
  )
}

output "backend_url" {
  description = "URL to access the backend API"
  value = local.api_url
}

output "swagger_url" {
  description = "URL to access the Swagger documentation"
  value = "${local.api_url}/docs"
}

output "deployment_info" {
  description = "Information about the deployment"
  value = {
    environment = var.environment
    deployment_type = var.subdirectory_name != "" ? "subdirectory (/${var.subdirectory_name})" : "root"
    backend_url = local.api_url
    frontend_url = var.environment == "local" ? (
      var.subdirectory_name != "" ? 
      "http://localhost:${var.frontend_port}/${var.subdirectory_name}" : 
      "http://localhost:${var.frontend_port}"
    ) : (
      var.subdirectory_name != "" ? 
      "http://${var.droplet_ip}:${var.frontend_port}/${var.subdirectory_name}" : 
      "http://${var.droplet_ip}:${var.frontend_port}"
    )
    api_url = local.api_url
    api_root_path = local.api_root_path
    build_platform = var.build_platform
    remote_domain = var.remote_domain
  }
}

output "container_names" {
  description = "Names of the deployed containers"
  value = {
    backend = var.backend_container_name
    frontend = var.frontend_container_name
  }
}

output "useful_commands" {
  description = "Useful Docker commands for troubleshooting"
  value = {
    check_backend_logs = "docker logs ${var.backend_container_name}"
    check_frontend_logs = "docker logs ${var.frontend_container_name}"
    check_containers = "docker ps"
    cleanup = "terraform destroy -auto-approve"
    restart_backend = "docker restart ${var.backend_container_name}"
    restart_frontend = "docker restart ${var.frontend_container_name}"
    exec_backend = "docker exec -it ${var.backend_container_name} /bin/bash"
    network_inspect = "docker network inspect ${var.docker_network_name}"
  }
}

output "quick_access" {
  description = "Quick access commands to open URLs"
  value = {
    open_frontend = var.environment == "local" ? "open http://localhost:${var.frontend_port}" : "open http://${var.droplet_ip}:${var.frontend_port}"
    open_api_docs = var.environment == "local" ? "open http://localhost:${var.backend_port}/docs" : "open http://${var.droplet_ip}:${var.backend_port}/docs"
    test_backend = var.environment == "local" ? "curl http://localhost:${var.backend_port}/" : "curl http://${var.droplet_ip}:${var.backend_port}/"
  }
}

output "network_info" {
  description = "Docker network configuration"
  value = {
    network_name = var.docker_network_name
    backend_internal_port = var.backend_port
    frontend_internal_port = var.frontend_port
  }
} 