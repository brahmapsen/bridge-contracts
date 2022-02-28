ver=1.0.0
echo "docker build -t \"scholtz2/zerobridge-soldier-eth2algo:$ver-stable\" -f eth2algo.yaml ../"
docker build -t "scholtz2/zerobridge-soldier-eth2algo:$ver-stable" -f eth2algo.yaml  ../
docker push "scholtz2/zerobridge-soldier-eth2algo:$ver-stable"
echo "Image: scholtz2/zerobridge-soldier-eth2algo:$ver-stable"
