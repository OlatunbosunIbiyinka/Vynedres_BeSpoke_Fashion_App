output "resource_group_name" {
  value = module.resource_group.name
}

output "api_url" {
  description = "VYNEDRES API URL"
  value       = module.container_apps.api_url
}

output "web_url" {
  description = "VYNEDRES Web URL"
  value       = module.container_apps.web_url
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = module.postgresql.fqdn
}

output "storage_account_name" {
  value = module.storage.name
}

output "key_vault_uri" {
  value = module.key_vault.vault_uri
}

output "database_name" {
  value = module.postgresql.database_name
}
