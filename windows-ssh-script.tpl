add-content -path c:/users/olatu/.ssh/config -value @'

Host $(hostname)
Hostname $(hostname)
User $(user)
IdentityFile $(identityfile)
'@