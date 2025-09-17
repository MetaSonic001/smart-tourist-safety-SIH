# 🔐 SIH Blockchain - Safety & Integrity Hub

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger%20Fabric-2.5.4-green.svg)](https://hyperledger-fabric.readthedocs.io/)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)](https://golang.org/)

A **Hyperledger Fabric blockchain network** for managing Digital IDs, incident reports, and evidence anchoring with cryptographic integrity proofs.

## 🎯 Overview

The SIH (Safety & Integrity Hub) blockchain provides:
- **🆔 Digital Identity Management** - Issue and verify DIDs with consent tracking
- **📋 Incident Reporting** - Immutable incident records with cryptographic summaries  
- **📎 Evidence Anchoring** - Link multimedia evidence to incidents with hash-based integrity
- **📊 Audit Trails** - Complete transaction history for compliance and forensics

### Key Features
- ✅ **Privacy-First**: Only stores hashes, never PII or raw location data
- ✅ **No Gas Fees**: Enterprise blockchain with predictable costs
- ✅ **High Performance**: 1000+ TPS with sub-second finality
- ✅ **Regulatory Compliant**: Complete audit trails and data integrity proofs

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** with Docker Desktop
- **Go 1.21+** 
- **Git** for version control

### 1. Clone Repository
```bash
git clone https://github.com/your-username/sih-blockchain.git
cd sih-blockchain
```

### 2. Setup Environment
```bash
# Download Hyperledger Fabric (one-time setup)
scripts\setup-fabric.bat

# Start blockchain network  
scripts\start-network.bat
```

### 3. Deploy Smart Contract
```bash
# Deploy your chaincode to blockchain
deploy-chaincode.bat
```

### 4. Test Implementation
```bash
# Run comprehensive tests
test-chaincode-functions.bat
```

## 📋 API Documentation

### Digital Identity Functions

#### Issue DID
```bash
peer chaincode invoke -c '{
  "function":"IssueDID",
  "Args":[
    "did:sih:alice123",
    "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "2024-01-01T00:00:00Z",
    "2025-01-01T00:00:00Z", 
    "SIH Authority"
  ]
}'
```

#### Verify DID
```bash
peer chaincode query -c '{
  "function":"VerifyDID",
  "Args":["did:sih:alice123"]
}'
```

### Incident Management Functions

#### Record Incident
```bash
peer chaincode invoke -c '{
  "function":"RecordIncident",
  "Args":[
    "INC001",
    "c3d4e5f6a7b8901234567890123456789012345678901234567890123456789012",
    "2024-02-01T14:30:00Z",
    "reporter@example.com"
  ]
}'
```

#### Anchor Evidence
```bash
peer chaincode invoke -c '{
  "function":"AnchorEvidence", 
  "Args":[
    "e5f6a7b8c9d0123456789012345678901234567890123456789012345678901234",
    "INC001",
    "image/jpeg",
    "witness@example.com"
  ]
}'
```

### Query Functions

#### Query Incidents by Time Range
```bash
peer chaincode query -c '{
  "function":"QueryIncidentsByTimeRange",
  "Args":["2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z"]
}'
```

#### Query Evidence by Incident
```bash
peer chaincode query -c '{
  "function":"QueryEvidenceByIncident", 
  "Args":["INC001"]
}'
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Chaincode     │    │   Blockchain    │
│   Web/Mobile    │◄──►│   (Go Smart     │◄──►│   Network       │
│   REST APIs     │    │   Contract)     │    │   (Fabric)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fabric SDK    │    │   Business      │    │   State         │
│   Client        │    │   Logic         │    │   Database      │
│   Libraries     │    │   Functions     │    │   (CouchDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 Testing

### Unit Tests
```bash
go test -v
```

### Integration Tests  
```bash
# Test all chaincode functions
test-chaincode-functions.bat

# Test specific function groups
test-chaincode-functions.bat did
test-chaincode-functions.bat incident  
test-chaincode-functions.bat evidence
```

### Performance Tests
```bash
go test -bench=.
```

## 📊 Blockchain Explorer

### CouchDB Web Interface
Access the blockchain state database:
- **URL**: http://localhost:5984/_utils
- **Username**: admin  
- **Password**: adminpw

### Docker Container Status
```bash
# View running containers
docker ps

# View container logs
docker logs peer0.org1.example.com
```

## 🛡️ Security Features

### Data Privacy
- **Hash-Only Storage**: Raw data never stored on blockchain
- **SHA-256 Validation**: All hashes verified before storage
- **Consent Tracking**: Cryptographic consent verification
- **Access Control**: Permissioned network with known participants

### Network Security
- **TLS Communications**: All peer-to-peer traffic encrypted
- **Certificate-Based Identity**: PKI for user authentication  
- **Endorsement Policies**: Multi-party transaction approval
- **Immutable Audit Trail**: Complete transaction history

## 📁 Project Structure

```
sih-blockchain/
├── main.go                      # Smart contract implementation
├── main_test.go                 # Comprehensive test suite
├── go.mod                       # Go dependencies
├── deploy-chaincode.bat         # Deployment automation
├── test-chaincode-functions.bat # Testing automation
├── connection-profile.json      # Network configuration
├── scripts/                     # Setup and utility scripts
│   ├── setup-fabric.bat        # Download Fabric components
│   └── start-network.bat       # Network management
└── docs/                        # Additional documentation
    ├── api-guide.md            # Detailed API documentation
    └── deployment-guide.md     # Production deployment guide
```

## 🚀 Deployment

### Development Environment
```bash
# Start local test network
cd fabric-samples\test-network  
network.sh up createChannel -ca -s couchdb

# Deploy chaincode
cd ..\..\sih-blockchain
deploy-chaincode.bat
```

### Production Environment
- Configure multi-host network topology
- Implement proper certificate management
- Set up monitoring and alerting
- Configure backup strategies
- Implement load balancing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Add comprehensive tests for new functionality
4. Ensure all tests pass: `go test -v`
5. Update documentation as needed
6. Submit pull request

### Development Guidelines
- Follow Go best practices and `gofmt` formatting
- Add comprehensive error handling and validation
- Include unit tests for all new functions
- Maintain backwards compatibility
- Update API documentation for changes

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting
- Check the [Troubleshooting Guide](docs/troubleshooting.md)
- Review container logs: `docker logs peer0.org1.example.com`
- Verify network status: `docker ps`

### Community
- **Issues**: [GitHub Issues](https://github.com/your-username/sih-blockchain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/sih-blockchain/discussions)  
- **Documentation**: [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)

---

**⚠️ Security Notice**: This chaincode is designed for integrity verification and audit trails. Always validate data before submitting hashes to the blockchain. Never store PII or sensitive raw data on-chain.

**🎯 Enterprise Ready**: This implementation follows Hyperledger Fabric best practices and is suitable for production deployment with proper infrastructure setup.