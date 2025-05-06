variable "docker_network_name" {
  description = "Name of the Docker network to create."
  type        = string
  default     = "invoice-forge-network"
}

variable "backend_port" {
  description = "Port for the backend service."
  type        = number
  default     = 8000
}

variable "frontend_port" {
  description = "Port for the frontend service."
  type        = number
  default     = 8010
} 