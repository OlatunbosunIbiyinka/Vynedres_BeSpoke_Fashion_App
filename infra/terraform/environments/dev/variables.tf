variable "location" {
  description = "Azure region"
  type        = string
  default     = "uksouth"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}

variable "db_admin_login" {
  description = "PostgreSQL administrator login"
  type        = string
  default     = "vynedresadmin"
}

variable "db_sku_name" {
  description = "PostgreSQL Flexible Server SKU"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "api_container_image" {
  description = "Container image for the API (replace after building and pushing to ACR)"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "web_container_image" {
  description = "Container image for the web app"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}
