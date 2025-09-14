#!/bin/bash

# Update package index
sudo apt-get update -y

# Install required dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Set up the stable Docker repository
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) stable"

# Update package index again
sudo apt-get update -y

# Install Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add the VM admin user to the docker group (replace 'adminuser' with your actual username)
sudo usermod -aG docker adminuser
