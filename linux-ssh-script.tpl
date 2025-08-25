cat << EOF >> ~/.ssh/config

Hostname $(hostname)
User $(user)
IdentityFile $(idntityfile)
EOF