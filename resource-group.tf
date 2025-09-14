resource "azurerm_resource_group" "nimbuscompute-rg" {
  name     = "nimbuscompute-resources"
  location = var.location

  tags = {
    environment = var.environment
  }
}
