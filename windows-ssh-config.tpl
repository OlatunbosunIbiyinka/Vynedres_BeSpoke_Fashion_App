$sshConfigPath = "$env:USERPROFILE\.ssh\config"

@"
Host my-azure-vm
    HostName ${hostname}
    User ${user}
    IdentityFile ${identityfile}
"@ | Set-Content -Path $sshConfigPath