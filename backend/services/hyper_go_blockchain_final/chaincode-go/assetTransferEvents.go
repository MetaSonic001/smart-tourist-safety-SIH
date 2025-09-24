/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"github.com/hyperledger/fabric-samples/asset-transfer-events/chaincode-go/chaincode"
)

func main() {
	sihChaincode, err := contractapi.NewChaincode(&chaincode.SIHChaincode{})
	if err != nil {
		log.Panicf("Error creating SIH chaincode: %v", err)
	}

	if err := sihChaincode.Start(); err != nil {
		log.Panicf("Error starting SIH chaincode: %v", err)
	}
}
