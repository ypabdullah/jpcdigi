echo "proses deploy vps"

npm run build

echo "deploy ke server"

scp -r dist/* root@202.10.44.157:/var/www/jpcdigi

echo "selesai"