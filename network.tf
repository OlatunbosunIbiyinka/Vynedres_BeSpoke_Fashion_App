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


resource "azurerm_public_ip" "nc-pip" {
  name                = "nc-pip"
  resource_group_name = azurerm_resource_group.nimbuscompute-rg.name
  location            = azurerm_resource_group.nimbuscompute-rg.location
  allocation_method   = "Static"
  sku                 = "Standard"

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
    public_ip_address_id          = azurerm_public_ip.nc-pip.id
  }

  tags = {
    environment = "dev"
  }
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