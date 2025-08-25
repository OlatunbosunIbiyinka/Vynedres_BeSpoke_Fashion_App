terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.0.0"
    }
  }
}

provider "azurerm" {
  features {}
}


resource "azurerm_resource_group" "nimbuscompute-rg" {
  name     = "nimbuscompute-resources"
  location = "UK south"

  tags = {
    environment = "dev"
  }
}


resource "azurerm_virtual_network" "nc-rg" {
  name                = "nimbuscompute-network"
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name
  location            = azurerm_resource_group.nimbuscompute-rg.location
  address_space       = ["10.0.0.0/16"]

  tags = {
    environment = "dev"
  }
}


resource "azurerm_subnet" "nc-subnet" {
  name                 = "nimbuscompute-subnet"
  resource_group_name  = azurerm_resource_group.nimbuscompute-rg.name
  virtual_network_name = azurerm_virtual_network.nc-rg.name
  address_prefixes     = ["10.0.1.0/24"]
}


resource "azurerm_network_security_group" "nc-sg" {
  name                = "nc-sg"
  location            = azurerm_resource_group.nimbuscompute-rg.location
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name


  tags = {
    environment = "dev"
  }

}

resource "azurerm_network_security_rule" "nc-dev-rule" {
  name                        = "nc-dev-rule"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_range      = "*"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = azurerm_resource_group.nimbuscompute-rg.name
  network_security_group_name = azurerm_network_security_group.nc-sg.name
}


resource "azurerm_subnet_network_security_group_association" "nc_sga" {
  subnet_id                 = azurerm_subnet.nc-subnet.id
  network_security_group_id = azurerm_network_security_group.nc-sg.id
}


resource "azurerm_public_ip" "nc-ip" {
  name                = "nc-ip"
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name
  location            = azurerm_resource_group.nimbuscompute-rg.location
  allocation_method   = "Dynamic"

  tags = {
    environment = "dev"
  }
}


resource "azurerm_network_interface" "nc-nic" {
  name                = "nc-nic"
  location            = azurerm_resource_group.nimbuscompute-rg.location
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.nc-subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.nc-ip.id
  }

  tags = {
    environment = "dev"
  }
}


resource "azurerm_linux_virtual_machine" "nc-vm" {
  name                = "nc-vm"
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name
  location            = azurerm_resource_group.nimbuscompute-rg.location
  size                = "Standard_B1s"
  admin_username      = "adminuser"
  network_interface_ids = [
  azurerm_network_interface.nc-nic.id]

  custom_data = filebase64("customdata.tpl")


  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/ncazurekey.pub")
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

  provisioner "local-exec" {
    command = templatefile("windows-ssh-script.tpl", {
      hostname     = self.public_ip_address,
      user         = "adminuser",
      identityfile = "~/.ssh/ncazurekey"
    })
    interpreter = ["Powershell", "-Command"]
  }

  tags = {
    environment = "dev"
  }
}


data "azurerm_public_ip" "nc-ip-data" {
  name = azurerm_public_ip.nc-ip.name
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name
}



output "public_ip_address" {
  value = "$(azurerm_linux_virtual_machine.nc-vm.name): $(data.azurerm_public_ip.nc-ip-data.ip_address)"
}