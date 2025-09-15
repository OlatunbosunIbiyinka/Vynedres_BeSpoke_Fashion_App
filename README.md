🌐 Azure Infrastructure with Terraform (IaC)

This project provisions a complete Azure cloud environment using Terraform as Infrastructure as Code (IaC). It demonstrates how to build a secure, automated, and production-ready setup that can be reused and scaled for different environments.

🚀 Project Overview

Automates the deployment of Azure infrastructure with Terraform.

Provisions networking, compute, and security resources.

Configures a Linux Virtual Machine with Docker preinstalled using cloud-init.

Ensures clean, modular, and reusable Terraform code.

Demonstrates IaC best practices with provider version locking, variables, outputs, and tagging.

🏗️ Architecture

Resources provisioned include:

Resource Group – logical container for all resources.

Virtual Network + Subnet – isolated, secure networking.

Network Security Group (NSG) – firewall rules for controlled inbound/outbound traffic.

Public IP & Network Interface (NIC) – connectivity to the VM.

Linux Virtual Machine – provisioned with cloud-init for automation.

Custom Data Script – installs Docker + dependencies automatically on boot.

⚙️ Features

Infrastructure as Code: Reproducible, version-controlled deployments.

Automation: No manual configuration — Docker is ready to use right after VM creation.

Security: NSG rules protect resources, and sensitive data is managed via variables.

Scalability: Modular .tf files (network, compute, outputs, variables) for easy expansion.

Governance: Tagging for resource management and cost tracking.

📂 Project Structure
.
├── provider.tf          # Azure provider configuration
├── resource-group.tf    # Resource group definition
├── network.tf           # VNet, subnet, NSG
├── compute.tf           # VM, NIC, Public IP
├── data.tf              # Data sources
├── output.tf            # Terraform outputs
├── variable.tf          # Input variables
├── terraform.tfvars     # Sensitive variable values (gitignored)
├── customdata.tpl       # Cloud-init script to install Docker
└── ssh-config.tpl       # Template for SSH configuration

🔑 Custom Data Script (Docker Install)

On VM creation, the following steps are automated:

Updates packages

Installs dependencies

Adds Docker’s official GPG key & repository

Installs Docker CE, CLI, and container runtime

Grants Docker access to the default user

This ensures every VM is ready for containerized workloads immediately.

▶️ Getting Started
Prerequisites

Terraform
 installed

Azure CLI
 installed & logged in

SSH key pair generated (~/.ssh/ncazurekey and ~/.ssh/ncazurekey.pub)

Steps

Clone the repository:

git clone https://github.com/<your-username>/Azure-Terraform-ncProject.git
cd Azure-Terraform-ncProject


Initialize Terraform:

terraform init


Preview resources:

terraform plan


Deploy resources:

terraform apply

📤 Outputs

After a successful deployment, Terraform provides the public IP address of the VM for SSH access:

ssh -i ~/.ssh/ncazurekey adminuser@<public-ip>

🔐 Security Notes

The .terraform/, *.tfstate, and *.tfvars files are excluded via .gitignore.

Sensitive data (like keys, credentials, and state) should never be pushed to GitHub.

📈 Future Enhancements

Add load balancers & autoscaling sets.

Implement monitoring & logging (Azure Monitor).

Deploy applications via Terraform modules.

Integrate CI/CD pipelines with GitHub Actions.

📌 Learning Outcomes

This project highlights:

Terraform IaC best practices

Azure networking & security fundamentals

Linux VM provisioning with automation

Docker-ready environments

GitHub workflow for cloud projects

👤 Author

Olatunbosun Ibiyinka
🔗 LinkedIn
 | 💻 GitHub

🏷️ Tags

Terraform · Azure · IaC · Cloud Engineering · DevOps · Docker · Automation
