variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "administrator_login" {
  type = string
}

variable "administrator_password" {
  type      = string
  sensitive = true
}

variable "database_name" {
  type    = string
  default = "vynedres"
}

variable "postgresql_version" {
  type    = string
  default = "16"
}

variable "sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "storage_mb" {
  type    = number
  default = 32768
}

variable "zone" {
  type    = string
  default = "1"
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "allow_azure_services" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
