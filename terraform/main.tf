terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

locals {
  env_content = fileexists("${path.root}/../.env") ? file("${path.root}/../.env") : ""
  workspace_dir = abspath(path.root)
  project_root = dirname(local.workspace_dir)
}

# Create a Docker network
resource "docker_network" "invoice_forge_network" {
  name = var.docker_network_name
}

# Build and run the backend container
resource "docker_image" "backend" {
  name = "invoice-forge-backend:latest"
  build {
    context = "${path.root}/../backend"
    tag     = ["invoice-forge-backend:latest"]
  }
  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset(path.root, "../backend/*") : filesha1(f)]))
  }
}

resource "docker_container" "backend" {
  name  = "invoice-forge-backend"
  image = docker_image.backend.image_id
  ports {
    internal = var.backend_port
    external = var.backend_port
  }
  networks_advanced {
    name = docker_network.invoice_forge_network.name
  }
  env = [
    "PORT=${var.backend_port}"
  ]
  depends_on = [docker_image.backend]
}

# Build and run the frontend container
resource "docker_image" "frontend" {
  name = "invoice-forge-frontend:latest"
  build {
    context = "${path.root}/../frontend"
    tag     = ["invoice-forge-frontend:latest"]
  }
  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset(path.root, "../frontend/*") : filesha1(f)]))
  }
}

resource "docker_container" "frontend" {
  name  = "invoice-forge-frontend"
  image = docker_image.frontend.image_id
  ports {
    internal = var.frontend_port
    external = var.frontend_port
  }
  networks_advanced {
    name = docker_network.invoice_forge_network.name
  }
  env = [
    "VITE_API_URL=http://localhost:${var.backend_port}"
  ]
  depends_on = [docker_container.backend]
} 