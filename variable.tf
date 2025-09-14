variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "UK South"
}

variable "environment" {
  description = "Environment tag for resources"
  type        = string
  default     = "dev"
}

variable "vm_size" {
  description = "Size of the virtual machine"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "adminuser"
}

variable "public_key_path" {
  description = "Path to the SSH public key"
  type        = string
  sensitive   = true
}

variable "private_key_path" {
  description = "Path to the SSH private key"
  type        = string
  sensitive   = true
}
