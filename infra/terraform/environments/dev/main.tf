terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment after creating a storage account for remote state
  # backend "azurerm" {
  #   resource_group_name  = "vynedres-tfstate-rg"
  #   storage_account_name = "vynedrestfstate"
  #   container_name       = "tfstate"
  #   key                  = "dev.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

locals {
  name_prefix = "vynedres-${var.environment}"
  common_tags = merge(var.tags, {
    Project     = "vynedres"
    Environment = var.environment
    ManagedBy   = "Terraform"
  })
}

module "resource_group" {
  source   = "../../modules/resource-group"
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.common_tags
}

module "log_analytics" {
  source              = "../../modules/log-analytics"
  name                = "${replace(local.name_prefix, "-", "")}logs"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  retention_in_days   = var.log_retention_days
  tags                = local.common_tags
}

resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

module "storage" {
  source              = "../../modules/storage"
  name                = "${replace(local.name_prefix, "-", "")}st${random_string.storage_suffix.result}"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  container_name      = "uploads"
  tags                = local.common_tags
}

resource "random_password" "db_admin" {
  length  = 24
  special = true
}

module "postgresql" {
  source                = "../../modules/postgresql"
  name                  = "${replace(local.name_prefix, "-", "")}pg"
  location              = module.resource_group.location
  resource_group_name   = module.resource_group.name
  administrator_login   = var.db_admin_login
  administrator_password = random_password.db_admin.result
  database_name         = "vynedres"
  sku_name              = var.db_sku_name
  tags                  = local.common_tags
}

module "key_vault" {
  source              = "../../modules/key-vault"
  name                = "${replace(local.name_prefix, "-", "")}kv"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  tags                = local.common_tags
}

module "container_apps" {
  source                   = "../../modules/container-apps"
  name                     = "${local.name_prefix}-cae"
  api_app_name             = "${local.name_prefix}-api"
  web_app_name             = "${local.name_prefix}-web"
  location                 = module.resource_group.location
  resource_group_name      = module.resource_group.name
  log_analytics_workspace_id = module.log_analytics.id
  environment              = var.environment
  database_url             = module.postgresql.connection_string
  api_image                = var.api_container_image
  web_image                = var.web_container_image
  tags                     = local.common_tags
}
