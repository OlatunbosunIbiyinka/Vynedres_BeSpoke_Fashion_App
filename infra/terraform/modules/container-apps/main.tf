resource "azurerm_container_app_environment" "this" {
  name                       = var.name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags                       = var.tags
}

resource "azurerm_container_app" "api" {
  name                         = var.api_app_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.api_min_replicas
    max_replicas = var.api_max_replicas

    container {
      name   = "api"
      image  = var.api_image
      cpu    = var.api_cpu
      memory = var.api_memory

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "PORT"
        value = "3001"
      }
    }
  }

  dynamic "secret" {
    for_each = var.database_url != "" ? [1] : []
    content {
      name  = "database-url"
      value = var.database_url
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3001
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

resource "azurerm_container_app" "web" {
  name                         = var.web_app_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.web_min_replicas
    max_replicas = var.web_max_replicas

    container {
      name   = "web"
      image  = var.web_image
      cpu    = var.web_cpu
      memory = var.web_memory

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
