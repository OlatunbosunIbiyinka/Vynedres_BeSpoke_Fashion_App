variable "name" {
  description = "Globally unique storage account name (3-24 lowercase alphanumeric)"
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "container_name" {
  type    = string
  default = "uploads"
}

variable "tags" {
  type    = map(string)
  default = {}
}
