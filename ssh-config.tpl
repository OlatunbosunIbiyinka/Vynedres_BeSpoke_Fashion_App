cat << EOF > ~/.ssh/config
Host my-azure-vm
    HostName ${hostname}
    User ${user}
    IdentityFile ${identityfile}
EOF
