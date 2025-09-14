data "azurerm_public_ip" "nc-data" {
  name = azurerm_public_ip.nc-pip.name
  resource_group_name   = azurerm_resource_group.nimbuscompute-rg.name
}