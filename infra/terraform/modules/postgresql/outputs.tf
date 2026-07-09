output "fqdn" {
  value = azurerm_postgresql_flexible_server.this.fqdn
}

output "database_name" {
  value = azurerm_postgresql_flexible_server_database.this.name
}

output "connection_string" {
  description = "PostgreSQL connection string (without sslmode param — add ?sslmode=require in production)"
  value       = "postgresql://${var.administrator_login}:${var.administrator_password}@${azurerm_postgresql_flexible_server.this.fqdn}:5432/${azurerm_postgresql_flexible_server_database.this.name}"
  sensitive   = true
}
