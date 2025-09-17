#!/bin/bash

set -e

# Check if FABRIC_DEV_MODE is true; if so, skip real setup
if [ "${FABRIC_DEV_MODE}" = "true" ]; then
    echo "FABRIC_DEV_MODE=true: Mocking Fabric setup. Use mock chaincode in Blockchain Service."
    mkdir -p fabric/wallet
    echo '{"mock": true}' > fabric/connection.json
    exit 0
fi

# Clone fabric-samples if not present
if [ ! -d "fabric-samples" ]; then
    git clone https://github.com/hyperledger/fabric-samples.git
fi

cd fabric-samples/test-network

# Bring up test network
./network.sh down
./network.sh up createChannel -c mychannel -ca

# Deploy sample chaincode (assuming basic Go asset-transfer)
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go

# Generate connection profile (using org1 as example)
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
peer channel getinfo -c mychannel

# Output connection profile (simplified; adjust for full gateway)
cat <<EOF > ../../fabric/connection.json
{
  "name": "test-network-org1",
  "version": "1.0.0",
  "client": {
    "organization": "Org1"
  },
  "organizations": {
    "Org1": {
      "mspid": "Org1MSP",
      "peers": ["peer0.org1.example.com"],
      "certificateAuthorities": ["ca.org1.example.com"]
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": {
        "pem": "$(cat organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt)"
      }
    }
  },
  "certificateAuthorities": {
    "ca.org1.example.com": {
      "url": "https://localhost:7054",
      "caName": "ca-org1",
      "tlsCACerts": {
        "pem": "$(cat organizations/peerOrganizations/org1.example.com/ca/ca.crt)"
      }
    }
  }
}
EOF

# Copy certs to wallet
mkdir -p ../../fabric/wallet
cp -r organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp ../../fabric/wallet/

echo "Fabric test network up. Connection profile at fabric/connection.json, wallet at fabric/wallet."