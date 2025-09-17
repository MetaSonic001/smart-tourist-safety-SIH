#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(command, description):
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print("STDOUT:")
        print(result.stdout)
    
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"❌ FAILED: {description}")
        return False
    else:
        print(f"✅ PASSED: {description}")
        return True

def main():
    print("🧪 Running Smart Tourist Safety Auth Service Tests")
    
    # Set environment for testing
    os.environ["MOCK_MODE"] = "true"
    os.environ["ENVIRONMENT"] = "test"
    
    tests = [
        ("python -m pytest tests/test_auth.py -v", "Authentication Tests"),
        ("python -m pytest tests/test_endpoints.py -v", "API Endpoint Tests"),
        ("python -c 'from auth import AuthManager; print(\"✓ Auth imports work\")'", "Import Tests"),
        ("python -c 'from main import app; print(\"✓ FastAPI app loads\")'", "App Loading Test"),
    ]
    
    passed = 0
    failed = 0
    
    for command, description in tests:
        if run_command(command, description):
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"TEST SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total:  {passed + failed}")
    
    if failed > 0:
        print(f"\n⚠️  Some tests failed. Check the output above for details.")
        sys.exit(1)
    else:
        print(f"\n🎉 All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()

