#!/usr/bin/env python3
"""
Development setup and utility script for blockchain bridge service
"""

import os
import sys
import json
import asyncio
import hashlib
import subprocess
from datetime import datetime
from pathlib import Path

import asyncpg
import redis
import httpx

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

async def setup_database():
    """Setup development database"""
    print("🗄️  Setting up database...")
    
    # Database connection details
    db_url = "postgresql://postgres:password@localhost:5432/blockchain_bridge"
    
    try:
        # Test connection
        conn = await asyncpg.connect(db_url)
        
        # Create tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS blockchain_tx (
                tx_id VARCHAR(255) PRIMARY KEY,
                op_type VARCHAR(50) NOT NULL,
                target_id VARCHAR(255) NOT NULL,
                submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                confirmed_at TIMESTAMP,
                raw_response JSONB
            )
        """)
        
        # Create indexes
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_blockchain_tx_target_id 
            ON blockchain_tx(target_id)
        """)
        
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_blockchain_tx_op_type 
            ON blockchain_tx(op_type)
        """)
        
        await conn.close()
        print("✅ Database setup complete")
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        print("💡 Make sure PostgreSQL is running and accessible")

def setup_redis():
    """Setup Redis for development"""
    print("🔴 Setting up Redis...")
    
    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        r.ping()
        print("✅ Redis connection successful")
        
        # Test pub/sub
        pubsub = r.pubsub()
        pubsub.subscribe('test')
        pubsub.unsubscribe('test')
        print("✅ Redis pub/sub working")
        
    except Exception as e:
        print(f"❌ Redis setup failed: {e}")
        print("💡 Make sure Redis is running on localhost:6379")

def create_fabric_wallet():
    """Create mock Fabric wallet directory"""
    print("📁 Creating Fabric wallet directory...")
    
    wallet_path = Path("./fabric_wallet")
    wallet_path.mkdir(exist_ok=True)
    
    # Create mock certificate files
    mock_cert = {
        "name": "admin",
        "type": "X.509",
        "mspId": "Org1MSP",
        "certificate": "-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE\n-----END CERTIFICATE-----",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----"
    }
    
    with open(wallet_path / "admin.id", "w") as f:
        json.dump(mock_cert, f, indent=2)
    
    print("✅ Fabric wallet directory created")

def create_env_file():
    """Create .env file for development"""
    print("⚙️  Creating .env file...")
    
    env_content = """# Development Environment Configuration
FABRIC_DEV_MODE=true
FABRIC_GATEWAY_URL=
FABRIC_SDK_CONFIG=
WALLET_PATH=./fabric_wallet
CHAINCODE_NAME=integrity_anchor
CHANNEL_NAME=mainchannel

DATABASE_URL=postgresql://postgres:password@localhost:5432/blockchain_bridge
REDIS_URL=redis://localhost:6379

ENCRYPTION_KEY=dev_key_12345678901234567890123456
LOG_LEVEL=DEBUG
"""
    
    if not os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ .env file created")
    else:
        print("ℹ️  .env file already exists")

async def test_service():
    """Test the blockchain bridge service"""
    print("🧪 Testing service endpoints...")
    
    base_url = "http://localhost:8002"
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            response = await client.get(f"{base_url}/health")
            if response.status_code == 200:
                print("✅ Health endpoint working")
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return
            
            # Test transaction submission
            test_payload_hash = hashlib.sha256(b"test_payload").hexdigest()
            test_transaction = {
                "op": "issue_did",
                "payload_hash": test_payload_hash,
                "metadata": {
                    "digital_id": "did:test:123",
                    "consent_hash": "test_consent",
                    "issued_at": datetime.utcnow().isoformat(),
                    "expires_at": datetime.utcnow().isoformat(),
                    "issuer": "test_issuer"
                }
            }
            
            response = await client.post(f"{base_url}/transactions", json=test_transaction)
            if response.status_code == 200:
                tx_data = response.json()
                print(f"✅ Transaction submitted: {tx_data['tx_id']}")
                
                # Test transaction status
                await asyncio.sleep(1)  # Wait a bit
                status_response = await client.get(f"{base_url}/transactions/{tx_data['tx_id']}")
                if status_response.status_code == 200:
                    print("✅ Transaction status endpoint working")
                
            else:
                print(f"❌ Transaction submission failed: {response.status_code}")
                print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        print("💡 Make sure the service is running on port 8002")

def run_service():
    """Run the service in development mode"""
    print("🚀 Starting blockchain bridge service...")
    
    try:
        subprocess.run([
            "uvicorn", "main:app",
            "--host", "0.0.0.0",
            "--port", "8002",
            "--reload",
            "--log-level", "debug"
        ])
    except KeyboardInterrupt:
        print("\n👋 Service stopped")

def show_redis_events():
    """Show Redis events in real-time"""
    print("🔴 Monitoring Redis events (Press Ctrl+C to stop)...")
    
    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        pubsub = r.pubsub()
        pubsub.subscribe('blockchain.tx.confirmed')
        
        print("📡 Listening for blockchain confirmations...")
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    event = json.loads(message['data'])
                    print(f"✅ Transaction confirmed: {event['tx_id']} ({event['type']})")
                    print(f"   Target: {event['target_id']}")
                    print(f"   Block: {event['block_no']}")
                    print(f"   Time: {event['timestamp']}")
                    print()
                except json.JSONDecodeError:
                    print(f"📨 Raw message: {message['data']}")
    
    except KeyboardInterrupt:
        print("\n👋 Stopped monitoring")
    except Exception as e:
        print(f"❌ Redis monitoring failed: {e}")

def generate_test_data():
    """Generate test transaction data"""
    print("🎲 Generating test transaction data...")
    
    test_cases = [
        {
            "name": "DID Issuance",
            "op": "issue_did",
            "metadata": {
                "digital_id": "did:emergency:user123",
                "consent_hash": hashlib.sha256(b"user_consent").hexdigest(),
                "issued_at": datetime.utcnow().isoformat(),
                "expires_at": "2026-01-01T00:00:00Z",
                "issuer": "emergency_authority"
            }
        },
        {
            "name": "Incident Recording",
            "op": "record_incident", 
            "metadata": {
                "incident_id": "INC-2025-001",
                "incident_summary_hash": hashlib.sha256(b"emergency_call_summary").hexdigest(),
                "created_at": datetime.utcnow().isoformat(),
                "reporter": "operator_001"
            }
        },
        {
            "name": "Evidence Anchoring",
            "op": "anchor_evidence",
            "metadata": {
                "evidence_hash": hashlib.sha256(b"call_recording_audio").hexdigest(),
                "incident_id": "INC-2025-001", 
                "uploaded_by": "operator_001"
            }
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        payload_hash = hashlib.sha256(f"test_payload_{i}".encode()).hexdigest()
        
        transaction = {
            "op": case["op"],
            "payload_hash": payload_hash,
            "metadata": case["metadata"]
        }
        
        print(f"\n📋 {case['name']}:")
        print(f"curl -X POST 'http://localhost:8002/transactions' \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{json.dumps(transaction, indent=2)}'")

def cleanup_dev_data():
    """Clean up development data"""
    print("🧹 Cleaning up development data...")
    
    try:
        # Clear database
        import asyncio
        asyncio.run(_cleanup_database())
        
        # Clear Redis
        r = redis.Redis(host='localhost', port=6379)
        r.flushdb()
        print("✅ Redis cleared")
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")

async def _cleanup_database():
    """Clean up database tables"""
    db_url = "postgresql://postgres:password@localhost:5432/blockchain_bridge"
    
    try:
        conn = await asyncpg.connect(db_url)
        await conn.execute("TRUNCATE TABLE blockchain_tx")
        await conn.close()
        print("✅ Database tables cleared")
    except Exception as e:
        print(f"❌ Database cleanup failed: {e}")

def check_dependencies():
    """Check if all dependencies are available"""
    print("🔍 Checking dependencies...")
    
    dependencies = [
        ("PostgreSQL", "psql --version"),
        ("Redis", "redis-cli --version"),
        ("Python", "python --version")
    ]
    
    for name, cmd in dependencies:
        try:
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip().split('\n')[0]
                print(f"✅ {name}: {version}")
            else:
                print(f"❌ {name}: Not found")
        except FileNotFoundError:
            print(f"❌ {name}: Not installed")

def show_help():
    """Show help information"""
    print("""
🚀 Blockchain Bridge Development Script

Commands:
  setup       - Complete development setup
  db          - Setup database only
  redis       - Test Redis connection
  wallet      - Create Fabric wallet directory
  env         - Create .env file
  test        - Test service endpoints
  run         - Run the service in development mode
  monitor     - Monitor Redis events
  testdata    - Generate test transaction examples
  cleanup     - Clean up development data
  deps        - Check dependencies
  help        - Show this help

Usage:
  python dev_setup.py <command>

Examples:
  python dev_setup.py setup    # Complete setup
  python dev_setup.py run      # Run service
  python dev_setup.py monitor  # Monitor events
""")

async def main():
    """Main development setup function"""
    if len(sys.argv) < 2:
        command = "help"
    else:
        command = sys.argv[1]
    
    if command == "setup":
        print("🔧 Running complete development setup...\n")
        create_env_file()
        create_fabric_wallet()
        await setup_database()
        setup_redis()
        check_dependencies()
        print("\n✅ Development setup complete!")
        print("💡 Run 'python dev_setup.py run' to start the service")
        
    elif command == "db":
        await setup_database()
        
    elif command == "redis":
        setup_redis()
        
    elif command == "wallet":
        create_fabric_wallet()
        
    elif command == "env":
        create_env_file()
        
    elif command == "test":
        await test_service()
        
    elif command == "run":
        run_service()
        
    elif command == "monitor":
        show_redis_events()
        
    elif command == "testdata":
        generate_test_data()
        
    elif command == "cleanup":
        cleanup_dev_data()
        
    elif command == "deps":
        check_dependencies()
        
    elif command == "help":
        show_help()
        
    else:
        print(f"❌ Unknown command: {command}")
        show_help()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)