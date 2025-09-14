resource "azurerm_linux_virtual_machine" "nc-vm" {
  name                  = "nc-vm"
  resource_group_name   = azurerm_resource_group.nimbuscompute-rg.name
  location              = azurerm_resource_group.nimbuscompute-rg.location
  size                  = "Standard_B1s"
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.nc-nic.id]

  # Cloud-init bootstrap script (installs Docker)
  custom_data = filebase64("customdata.tpl")


  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  # Local provisioner: generates SSH config entry on your host
  provisioner "local-exec" {
    command = templatefile("windows-ssh-config.tpl", {
      hostname     = self.public_ip_address,
      user         = var.admin_username,
      identityfile = var.private_key_path
    })
    interpreter = ["PowerShell", "-Command"]
  }

  tags = {
    environment = var.environment
  }
}
