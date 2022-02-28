cd /home/cicd/contract/zerobridge-smart-contracts

git pull || error_code=$?
echo $error_code;
if [ $error_code -ne 0 ]; then
    echo "git pull failed";
	exit;
fi

rm -rf build/contracts
#rm -rf node_modules

source .env
npm i

truffle compile || error_code=$?
echo "error_code $error_code"
if [ $error_code -ne 0 ]; then
    echo "unable to compile";
	exit 1;
fi

# wait until another process of ganache-cli is finished
while pgrep -u cicd node > /dev/null; do sleep 1; done


echo "starting ganache-cli"
/usr/bin/ganache-cli &
sleep 5

truffle test || error_code=$?

echo "error_code $error_code"
if [ $error_code -ne 0 ]; then
    echo "Tests failed";


	proc=`pgrep -l -u cicd | grep node | cut -f1 -d" "`
	echo "killing ganache-cli $proc"
	kill -s 9 $proc
	
	exit 1;
fi
proc=`pgrep -l -u cicd | grep node | cut -f1 -d" "`
echo "killing ganache-cli $proc"
kill -s 9 $proc

if [ $usepolygon -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --network mumbai || error_code=$?
	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/polygon -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	# PUSH GITs
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy polygon contract"
	git push
	
	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/polygon -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy polygon contract"
	git push

fi

if [ $usersk -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --network rsk  || error_code=$?

	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/rsk_testnet -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy rsk_testnet contract"
	git push

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/rsk_testnet -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy rsk_testnet contract"
	git push
fi


if [ $useropsten -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --reset --network ropsten  || error_code=$?

	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/ropsten -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy ropsten contract"
	git push
	
	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/ropsten -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy ropsten contract"
	git push

fi


if [ $usekovan -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --reset --network kovan  || error_code=$?

	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/kovan -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy kovan_testnet contract"
	git push
	
	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/kovan -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy kovan contract"
	git push

fi


if [ $userinkeby -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --reset --network rinkeby  || error_code=$?

	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/rinkeby -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy rinkeby contract"
	git push
	
	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/rinkeby -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy rinkeby contract"
	git push

fi
if [ $usegoerli -eq 1 ]; then

	cd /home/cicd/contract/zerobridge-smart-contracts
	rm -rf build/contracts

	truffle migrate --reset --network goerli  || error_code=$?

	echo "error_code $error_code"
	if [ $error_code -ne 0 ]; then
		echo "migrate failed";
		exit 1;
	fi

	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/soldier/eth-algo-gossip/contracts/goerli -f

	# TOKEN MAPPING
	cd /home/cicd/soldier/eth-algo-gossip/ethereum
	node tokenMapping.js > /home/cicd/soldier/eth-algo-gossip/soldier/env/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-einstein/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-newton/mapping/mapping.json
	node tokenMapping.js > /home/cicd/soldier/k8s/soldier-goethe/mapping/mapping.json
	node tokenMapping.js > /home/cicd/web/zero-bridge-ui/assets/contracts/mapping.json
	
	cd /home/cicd/soldier/eth-algo-gossip/
	git pull
	git add .
	git commit -m "deploy goerli contract"
	git push
	
	cp /home/cicd/contract/zerobridge-smart-contracts/build/contracts/* /home/cicd/web/zero-bridge-ui/assets/contracts/goerli -f

	cd /home/cicd/web/zero-bridge-ui
	git pull
	git add .
	git commit -m "deploy goerli contract"
	git push

fi
cd /home/cicd/contract/zerobridge-smart-contracts
rm -rf cp build/contracts
