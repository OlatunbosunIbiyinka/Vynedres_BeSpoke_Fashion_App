output "environment_id" {
  value = azurerm_container_app_environment.this.id
}

output "api_fqdn" {
  value = azurerm_container_app.api.ingress[0].fqdn
}

output "web_fqdn" {
  value = azurerm_container_app.web.ingress[0].fqdn
}

output "api_url" {
  value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "web_url" {
  value = "https://${azurerm_container_app.web.ingress[0].fqdn}"
}
