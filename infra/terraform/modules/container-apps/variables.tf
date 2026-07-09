variable "name" {
  description = "Container Apps Environment name"
  type        = string
}

variable "api_app_name" {
  type = string
}

variable "web_app_name" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "environment" {
  type    = string
  default = "production"
}

variable "database_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "api_image" {
  type    = string
  default = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "web_image" {
  type    = string
  default = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "api_min_replicas" {
  type    = number
  default = 0
}

variable "api_max_replicas" {
  type    = number
  default = 2
}

variable "web_min_replicas" {
  type    = number
  default = 0
}

variable "web_max_replicas" {
  type    = number
  default = 2
}

variable "api_cpu" {
  type    = number
  default = 0.25
}

variable "api_memory" {
  type    = string
  default = "0.5Gi"
}

variable "web_cpu" {
  type    = number
  default = 0.25
}

variable "web_memory" {
  type    = string
  default = "0.5Gi"
}

variable "tags" {
  type    = map(string)
  default = {}
}
