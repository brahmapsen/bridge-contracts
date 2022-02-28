ver=1.0.0
docker build -t "scholtz2/ubuntu-dev-base:$ver-stable" -f dev-base.yaml .
docker push "scholtz2/ubuntu-dev-base:$ver-stable"
echo "Image: scholtz2/ubuntu-dev-base:$ver-stable"
