import os
import sys
from twilio.rest import Client
import subprocess
import time
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "GROQ_API_KEY"]
    missing = [var for var in required_vars if not os.environ.get(var)]
    
    if missing:
        print(f"Error: Missing environment variables: {', '.join(missing)}")
        print("Please set them in your .env file:")
        for var in missing:
            if var == "GROQ_API_KEY":
                print(f"{var}=your_groq_api_key_from_console.groq.com")
            else:
                print(f"{var}=your_{var.lower()}")
        return False
    return True

def start_ngrok(port=5000):
    """Start ngrok and return the public URL"""
    print(f"Starting ngrok tunnel for tourism emergency system on port {port}...")
    
    # Check if ngrok is installed
    try:
        result = subprocess.run(["ngrok", "--version"], check=True, capture_output=True, text=True)
        print(f"Found ngrok: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: ngrok is not installed or not in PATH.")
        print("Please install ngrok:")
        print("1. Download from https://ngrok.com/download")
        print("2. Extract and add to your PATH")
        print("3. Sign up at https://ngrok.com and get your auth token")
        print("4. Run: ngrok authtoken YOUR_TOKEN")
        return None
    
    # Start ngrok process
    print("Starting ngrok tunnel...")
    ngrok_process = subprocess.Popen(
        ["ngrok", "http", str(port), "--log=stdout"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for ngrok to start
    time.sleep(4)
    
    # Get ngrok URL
    try:
        response = requests.get("http://localhost:4040/api/tunnels", timeout=10)
        data = response.json()
        
        if not data["tunnels"]:
            print("Error: No ngrok tunnels found.")
            print("Make sure ngrok is properly authenticated with: ngrok authtoken YOUR_TOKEN")
            return None
        
        # Get HTTPS URL (preferred for Twilio)
        for tunnel in data["tunnels"]:
            if tunnel["proto"] == "https":
                return tunnel["public_url"]
        
        # Fallback to HTTP if HTTPS not found
        return data["tunnels"][0]["public_url"]
    except Exception as e:
        print(f"Error getting ngrok URL: {str(e)}")
        print("Make sure ngrok is running and accessible on localhost:4040")
        return None

def setup_twilio_number(ngrok_url):
    """Configure a Twilio phone number to use our tourism emergency webhook URLs"""
    if not check_environment():
        return
    
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    
    client = Client(account_sid, auth_token)
    
    # Test Twilio credentials
    try:
        account = client.api.accounts(account_sid).fetch()
        print(f"Connected to Twilio account: {account.friendly_name}")
    except Exception as e:
        print(f"Error connecting to Twilio: {str(e)}")
        print("Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN")
        return None
    
    # Get available phone numbers
    try:
        numbers = client.incoming_phone_numbers.list()
        
        if not numbers:
            print("No phone numbers found in your Twilio account.")
            print("Would you like to purchase a new number for tourism emergency system? (y/n)")
            choice = input().lower()
            
            if choice == 'y':
                # Get available numbers for tourism emergency service
                print("\nSelect country for tourism emergency number:")
                print("1. IN (India) - Recommended for Indian tourism")
                print("2. US (United States) - For international tourists")
                print("3. GB (United Kingdom) - For European tourists")
                
                country_choice = input("Enter choice (1-3): ")
                country_codes = {"1": "IN", "2": "US", "3": "GB"}
                country_code = country_codes.get(country_choice, "IN")
                
                print(f"Searching for available numbers in {country_code}...")
                available_numbers = client.available_phone_numbers(country_code).local.list(limit=5)
                
                if not available_numbers:
                    print(f"No numbers available for country code {country_code}.")
                    print("Try a different country code or check your Twilio account balance.")
                    return
                
                print(f"\nAvailable tourism emergency numbers in {country_code}:")
                for i, number in enumerate(available_numbers):
                    print(f"{i+1}. {number.friendly_name} - {number.phone_number}")
                
                selection = int(input(f"\nSelect a number to purchase (1-{len(available_numbers)}): ")) - 1
                if 0 <= selection < len(available_numbers):
                    selected_number = available_numbers[selection]
                    
                    # Purchase and configure the number
                    number = client.incoming_phone_numbers.create(
                        phone_number=selected_number.phone_number,
                        friendly_name=f"Tourism Emergency - {country_code}",
                        voice_url=f"{ngrok_url}/voice",
                        voice_method="POST"
                    )
                    print(f"✅ Successfully purchased and configured {number.phone_number}")
                    print(f"   This number is now set up for tourism emergency calls")
                    return number.phone_number
                else:
                    print("Invalid selection")
                    return
            else:
                print("Setup cancelled")
                return
        else:
            print(f"\nFound {len(numbers)} existing phone number(s) in your account:")
            for i, number in enumerate(numbers):
                status = "✅ Active" if number.status == "in-use" else "⚠️  Inactive"
                print(f"{i+1}. {number.friendly_name} - {number.phone_number} [{status}]")
            
            print(f"\nSelect a number to configure for tourism emergency system (1-{len(numbers)}):")
            selection = int(input()) - 1
            
            if 0 <= selection < len(numbers):
                number = numbers[selection]
                
                # Update the webhook URL
                number.update(
                    voice_url=f"{ngrok_url}/voice",
                    voice_method="POST",
                    friendly_name=f"Tourism Emergency - {number.friendly_name}"
                )
                
                print(f"✅ Successfully configured {number.phone_number}")
                print(f"   Voice webhook: {ngrok_url}/voice")
                print(f"   This number is now ready for tourism emergency calls")
                return number.phone_number
            else:
                print("Invalid selection")
                return
    except Exception as e:
        print(f"Error setting up Twilio number: {str(e)}")
        return None

def test_system_integration(phone_number, ngrok_url):
    """Test the complete tourism emergency system"""
    print("\n" + "="*60)
    print("🏥 TOURISM EMERGENCY SYSTEM - TESTING")
    print("="*60)
    
    print(f"📞 Emergency Number: {phone_number}")
    print(f"🌐 Webhook URL: {ngrok_url}")
    
    # Test webhook endpoint
    try:
        test_response = requests.get(f"{ngrok_url}/health", timeout=5)
        if test_response.status_code == 200:
            print("✅ Flask app is responding correctly")
            health_data = test_response.json()
            print(f"   ChromaDB status: {health_data.get('chromadb', 'unknown')}")
            print(f"   Knowledge base: {health_data.get('knowledge_base', 'unknown')}")
        else:
            print("⚠️  Flask app returned unexpected status")
    except Exception as e:
        print(f"❌ Flask app is not responding: {str(e)}")
        print("   Make sure you're running: python app.py")
    
    print("\n📋 TEST SCENARIOS FOR TOURISM EMERGENCIES:")
    print("1. Call and say: 'I'm a tourist from Germany, lost my passport in Mumbai near Gateway of India'")
    print("2. Call and say: 'Food poisoning at hotel in Goa, need medical help'") 
    print("3. Call and say: 'Theft in Delhi market, they took my wallet and phone'")
    print("4. Call and say: 'Medical emergency, tourist from UK, having chest pain'")
    print("5. Call and say: 'Lost and scared, Japanese tourist, don't know where I am'")
    
    print(f"\n🌐 Web Test Interface: {ngrok_url}/test_tourism")
    print(f"📊 System Health Check: {ngrok_url}/health")

def main():
    print("🏥 TOURISM EMERGENCY RESPONSE SYSTEM - TWILIO SETUP")
    print("=" * 60)
    print("This will set up your Twilio phone number for tourism emergency calls")
    print("integrated with the Smart Tourist Safety & Incident Response System")
    
    # Check environment
    if not check_environment():
        return
    
    # Start ngrok to get public URL
    print("\n📡 Setting up secure tunnel...")
    ngrok_url = start_ngrok()
    if not ngrok_url:
        print("Failed to start ngrok. Please check the installation.")
        return
    
    print(f"✅ Secure tunnel established: {ngrok_url}")
    
    # Configure Twilio number
    print("\n📞 Configuring Twilio phone number...")
    phone_number = setup_twilio_number(ngrok_url)
    
    if phone_number:
        print("\n🎉 SETUP COMPLETE!")
        test_system_integration(phone_number, ngrok_url)
        
        print("\n" + "="*60)
        print("🚨 IMPORTANT: KEEP THIS TERMINAL RUNNING")
        print("="*60)
        print("This terminal maintains the ngrok tunnel required for Twilio webhooks.")
        print("If you close it, the phone number will stop working.")
        print("\nTo stop the system:")
        print("1. Press Ctrl+C in this terminal")
        print("2. Stop the Flask app (python app.py) if running separately")
        
        print(f"\n📞 TOURISM EMERGENCY NUMBER: {phone_number}")
        print("This number is now ready to handle tourism emergency calls!")
        
        # Keep the script running
        try:
            while True:
                time.sleep(30)
                # Optionally ping the health endpoint
                try:
                    requests.get(f"{ngrok_url}/health", timeout=5)
                except:
                    pass
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down tourism emergency system...")
            print("Ngrok tunnel closed. Phone number is now inactive.")
    else:
        print("❌ Failed to configure Twilio number")
        print("Please check your Twilio account and credentials")

if __name__ == "__main__":
    main()