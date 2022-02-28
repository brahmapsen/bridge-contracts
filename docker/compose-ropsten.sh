docker build -t "scholtz2/zerobridge-contract-ropsten:dev" -f ropsten.compose  ../

docker-compose -f truffle.yaml up

#docker rmi "scholtz2/zerobridge-contract-ropsten:latest"
