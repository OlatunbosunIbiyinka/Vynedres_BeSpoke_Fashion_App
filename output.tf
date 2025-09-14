output "public_ip_address" {
    value = "${azurerm_linux_virtual_machine.nc-vm.name}: ${data.azurerm_public_ip.nc-data.ip_address}"
}