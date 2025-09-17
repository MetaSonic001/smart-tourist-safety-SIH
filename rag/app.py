# Add this import at the top of the file
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# The rest of your imports
from flask import Flask, request, Response, jsonify, redirect
import os
import json
import chromadb
import requests
import logging
from twilio.twiml.voice_response import VoiceResponse, Gather
from chromadb.utils import embedding_functions
import time
import requests

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.before_request
def before_request():
    # Force HTTPS for all routes when using ngrok
    if 'ngrok' in request.host and request.headers.get('X-Forwarded-Proto') == 'http':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama3-8b-8192"
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")

# Initialize ChromaDB - Updated for tourism knowledge
client = chromadb.PersistentClient("./chroma_db")
embedding_function = embedding_functions.DefaultEmbeddingFunction()
collection = client.get_or_create_collection(
    name="tourism_emergency_knowledge",
    embedding_function=embedding_function,
    metadata={"description": "Tourism emergency response information for India"}
)

# Session storage for tracking conversation state
sessions = {}

def get_or_create_session(call_sid):
    """Create or retrieve a session for the current call"""
    if call_sid not in sessions:
        sessions[call_sid] = {
            "conversation_history": [
                {"role": "system", "content": """You are a tourism emergency response agent for India's 112 service specializing in tourist assistance. Be calm, clear, and culturally sensitive. Your goal is to quickly gather key information about the tourist emergency and provide appropriate assistance.

PRIORITY INFORMATION TO COLLECT:
1) Tourist's current location (hotel name, landmark, address, GPS if available)
2) Type of emergency (medical, theft, lost, transport, accommodation, etc.)
3) Tourist's nationality and language preference
4) Whether they have travel insurance or embassy contact
5) If they have Smart Tourist Digital ID

KEY TOURISM CONSIDERATIONS:
- Many tourists may not speak local languages fluently
- They may not know local emergency numbers or procedures  
- They might be unfamiliar with Indian cultural context
- Always offer both 112 and 1363 (Tourist Helpline) numbers
- Ask about Digital ID from Smart Tourist Safety system if applicable
- Consider embassy involvement for serious issues

Keep responses short, clear, and reassuring. Ask one question at a time."""}
            ],
            "emergency_info": {
                "location": None,
                "emergency_type": None,
                "situation": None,
                "caller_contact": None,
                "nationality": None,
                "digital_id": None,
                "travel_insurance": None,
                "hotel_info": None,
                "complete": False
            },
            "current_step": "initial"
        }
    return sessions[call_sid]

def query_tourism_rag(query, session):
    """Query the tourism-specific RAG system to generate a response"""
    # Retrieve relevant tourism emergency information from ChromaDB
    results = collection.query(
        query_texts=[query],
        n_results=4  # Get more results for comprehensive tourism coverage
    )
    
    # Extract retrieved documents
    retrieved_docs = results['documents'][0]
    retrieved_metadatas = results['metadatas'][0]
    
    # Format retrieved context with tourism focus
    context = "\n\n".join([
        f"Category: {meta.get('category', 'N/A')} | Priority: {meta.get('priority', 'medium')}\n{doc}" 
        for doc, meta in zip(retrieved_docs, retrieved_metadatas)
    ])
    
    # Update conversation with user input
    session["conversation_history"].append({"role": "user", "content": query})
    
    # Create tourism-specific prompt for the LLM
    prompt = f"""Based on the following tourism emergency knowledge base:

{context}

Current conversation history:
{json.dumps(session["conversation_history"], indent=2)}

Tourist emergency information gathered so far:
- Location: {session["emergency_info"]["location"] or "Not provided yet"}
- Emergency Type: {session["emergency_info"]["emergency_type"] or "Not provided yet"}
- Nationality: {session["emergency_info"]["nationality"] or "Not provided yet"}
- Digital ID: {session["emergency_info"]["digital_id"] or "Not checked yet"}
- Hotel Info: {session["emergency_info"]["hotel_info"] or "Not provided yet"}
- Travel Insurance: {session["emergency_info"]["travel_insurance"] or "Not checked yet"}
- Situation Details: {session["emergency_info"]["situation"] or "Not provided yet"}

TOURISM EMERGENCY RESPONSE GUIDELINES:
- Prioritize immediate safety and location confirmation
- Consider language barriers and cultural sensitivity
- Offer both emergency services (112) and tourist helpline (1363)
- Ask about Digital ID if tourist mentions smart safety system
- Consider embassy involvement for passport/legal issues
- Keep responses under 3 sentences
- Be calm, clear, and reassuring

Respond as a tourism emergency dispatcher. If you have essential information (location + emergency type), inform about services being dispatched and provide relevant tourism-specific safety guidance."""

    # Call Groq API
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 256
            }
        )
        response_data = response.json()
        agent_response = response_data["choices"][0]["message"]["content"]
        
        # Update conversation history
        session["conversation_history"].append({"role": "assistant", "content": agent_response})
        
        # Extract tourism emergency information
        update_tourism_emergency_info(query, agent_response, session)
        
        return agent_response
    except Exception as e:
        logger.error(f"Error calling Groq API: {str(e)}")
        return "I'm having trouble processing your request. Please clearly state your emergency, your location, and if you're a tourist visiting India."

def update_tourism_emergency_info(user_input, response, session):
    """Extract and update tourism emergency information based on conversation"""
    # Extract tourism emergency info from user input
    input_for_extraction = "\n".join([
        msg["content"] for msg in session["conversation_history"] if msg["role"] == "user"
    ])
    
    extraction_prompt = f"""
    Extract tourism emergency information from this text:
    {input_for_extraction}
    
    Current information:
    {json.dumps(session["emergency_info"], indent=2)}
    
    Output ONLY a JSON object with fields:
    - location: (current location, hotel name, landmark, or null if unclear)
    - emergency_type: (medical, theft, lost, transport, accommodation, scam, documentation, or null if unclear)
    - nationality: (tourist's country or null if not mentioned)  
    - digital_id: (if they mention digital ID or smart tourist system, otherwise null)
    - travel_insurance: (true/false/null if not mentioned)
    - hotel_info: (hotel name or accommodation details, or null)
    - situation: (brief description of what's happening or null)
    - caller_contact: (phone number or null)
    - complete: (true if we have location AND emergency_type, otherwise false)
    """
    
    try:
        extraction_response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": extraction_prompt}],
                "temperature": 0.1,
                "max_tokens": 256
            }
        )
        
        extracted_data = extraction_response.json()["choices"][0]["message"]["content"]
        
        # Find JSON in response
        import re
        json_match = re.search(r'{.*}', extracted_data, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            try:
                extracted_info = json.loads(json_str)
                # Update session with new information (only if values are not None)
                for key, value in extracted_info.items():
                    if value is not None and value != "null" and value != "":
                        session["emergency_info"][key] = value
            except json.JSONDecodeError:
                logger.error("Failed to parse extracted JSON")
    except Exception as e:
        logger.error(f"Error extracting tourism emergency info: {str(e)}")

@app.route("/voice", methods=["POST"])
def voice():
    """Handle incoming calls and start the conversation using Twilio's Say TTS"""
    response = VoiceResponse()
    call_sid = request.values.get("CallSid")
    session = get_or_create_session(call_sid)
    
    # Tourism-specific initial greeting using Twilio's Say
    response.say("This is India's 112 emergency services with tourism assistance. Please tell me your emergency, current location, and if you are visiting India as a tourist.", 
                 voice="woman", language="en-IN")
    
    # Gather speech input
    gather = Gather(
        input="speech",
        action="/process_speech",
        method="POST",
        speechTimeout="3",  # Slightly longer for tourists who may need time to think
        speechModel="phone_call",
        language="en-IN"
    )
    response.append(gather)
    
    # If no speech detected, retry with additional guidance
    response.say("I didn't hear you. Please speak clearly and tell me what emergency assistance you need.", 
                 voice="woman", language="en-IN")
    response.redirect("/voice")
    
    return Response(str(response), mimetype="text/xml")

@app.route("/process_speech", methods=["POST"])
def process_speech():
    """Process speech input from the caller using Twilio's Say TTS"""
    logger.debug("===== TOURISM EMERGENCY SPEECH PROCESSING =====")
    logger.debug(f"All request values: {request.values.to_dict()}")

    response = VoiceResponse()
    call_sid = request.values.get("CallSid")
    logger.debug(f"Call SID: {call_sid}")

    session = get_or_create_session(call_sid)
    session["call_sid"] = call_sid

    logger.debug(f"Current tourism session state: {json.dumps(session, indent=2)}")

    # Get speech input
    speech_result = request.values.get("SpeechResult")
    logger.debug(f"Speech result: {speech_result}")

    if speech_result:
        # Query tourism-specific RAG for response
        agent_response = query_tourism_rag(speech_result, session)
        
        # Use Twilio's Say for the response
        response.say(agent_response, voice="woman", language="en-IN")
        
        # Send data to tourism dashboard
        send_to_tourism_dashboard(session)

        # Continue gathering more speech input
        gather = Gather(
            input="speech",
            action="/process_speech",
            method="POST",
            speechTimeout="3",
            speechModel="phone_call",
            language="en-IN"
        )
        response.append(gather)
        
        # If tourism emergency info is complete, provide comprehensive assistance
        if session["emergency_info"]["complete"]:
            # Log detailed tourism emergency information
            logger.info(f"TOURISM EMERGENCY DETAILS: {json.dumps(session['emergency_info'], indent=2)}")
            
            # Provide tourism-specific final confirmation if not sent yet
            if session["current_step"] != "confirmation_sent":
                confirmation_parts = []
                
                # Base confirmation
                confirmation_parts.append(f"Emergency services have been alerted for your {session['emergency_info']['emergency_type']} emergency")
                
                # Location-specific
                if session["emergency_info"]["location"]:
                    confirmation_parts.append(f"at {session['emergency_info']['location']}")
                
                # Tourism-specific additions
                additional_info = []
                if session["emergency_info"]["nationality"]:
                    additional_info.append(f"Tourist helpline 1363 is also available for {session['emergency_info']['nationality']} visitors")
                
                if session["emergency_info"]["digital_id"]:
                    additional_info.append("Your Smart Tourist ID information has been accessed to assist responders")
                
                if session["emergency_info"]["emergency_type"] in ["theft", "documentation", "scam"]:
                    additional_info.append("You may also need to contact your embassy")
                
                confirmation = ". ".join(confirmation_parts) + ". " + " ".join(additional_info) + ". Please stay on the line if you need further assistance."
                
                response.say(confirmation, voice="woman", language="en-IN")
                session["current_step"] = "confirmation_sent"
    else:
        # Handle case when speech cannot be recognized
        response.say("I couldn't understand. Please speak clearly and tell me your emergency situation and current location in India.", voice="woman", language="en-IN")
        gather = Gather(
            input="speech",
            action="/process_speech",
            method="POST",
            speechTimeout="3",
            speechModel="phone_call",
            language="en-IN"
        )
        response.append(gather)
    
    # If no further input received, redirect to handle
    response.redirect("/process_speech")
    
    return Response(str(response), mimetype="text/xml")

def send_to_tourism_dashboard(session):
    """Send tourism emergency information to the dashboard via websocket server"""
    try:
        # Prepare tourism-specific data for the dashboard
        conversation_data = session["conversation_history"]
        emergency_info = session["emergency_info"]
        
        # Enhanced payload with tourism-specific fields
        payload = {
            "id": session.get("call_sid", f"tourism_call-{int(time.time())}"),
            "type": "tourism_emergency",
            "convo": {
                "data": conversation_data
            },
            "emergency_details": {
                "location": emergency_info.get("location"),
                "emergency_type": emergency_info.get("emergency_type"),
                "nationality": emergency_info.get("nationality"),
                "digital_id": emergency_info.get("digital_id"),
                "hotel_info": emergency_info.get("hotel_info"),
                "travel_insurance": emergency_info.get("travel_insurance"),
                "situation": emergency_info.get("situation"),
                "timestamp": time.time(),
                "status": "active" if not emergency_info.get("complete") else "dispatched"
            },
            "tourism_flags": {
                "requires_embassy": emergency_info.get("emergency_type") in ["documentation", "legal", "theft"],
                "language_barrier": emergency_info.get("nationality") not in ["India", "UK", "US", "Australia"],
                "insurance_check": emergency_info.get("travel_insurance") == True,
                "digital_id_verified": emergency_info.get("digital_id") is not None
            }
        }
            
        # Send POST request to the tourism dashboard websocket server
        response = requests.post(
            "http://localhost:8080/tourism-webhook",  # Tourism-specific endpoint
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
            
        if response.status_code == 200:
            logger.info("Successfully sent tourism emergency data to dashboard")
        else:
            logger.error(f"Failed to send data to tourism dashboard: {response.status_code}")
                
    except Exception as e:
        logger.error(f"Error sending tourism data to dashboard: {str(e)}")

# Tourism-specific test endpoint
@app.route("/test_tourism", methods=["GET", "POST"])
def test_tourism_endpoint():
    """Test endpoint to simulate tourism emergency conversation without Twilio"""
    if request.method == "POST":
        user_input = request.form.get("user_input")
        test_session = get_or_create_session("test_tourism_session")
        response = query_tourism_rag(user_input, test_session)
        return {
            "response": response,
            "emergency_info": test_session["emergency_info"],
            "tourism_analysis": {
                "requires_embassy": test_session["emergency_info"]["emergency_type"] in ["documentation", "legal", "theft"],
                "tourist_helpline_needed": True,
                "language_support": test_session["emergency_info"]["nationality"] not in ["India", "UK", "US", "Australia"]
            }
        }
    return """
    <html>
        <body>
            <h1>Test Tourism Emergency Response System</h1>
            <p>Simulate tourist emergency calls with scenarios like:</p>
            <ul>
                <li>Lost passport in Mumbai</li>
                <li>Food poisoning at hotel in Goa</li>
                <li>Theft in Delhi market</li>
                <li>Transportation emergency in Rajasthan</li>
                <li>Medical emergency with language barrier</li>
            </ul>
            <form method="post">
                <input type="text" name="user_input" placeholder="Describe your tourist emergency..." style="width:400px;">
                <button type="submit">Send</button>
            </form>
        </body>
    </html>
    """

# Health check for tourism services
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for tourism emergency system"""
    try:
        # Test ChromaDB connection
        test_results = collection.query(query_texts=["test"], n_results=1)
        chroma_status = "healthy" if test_results else "error"
    except:
        chroma_status = "error"
    
    return jsonify({
        "status": "healthy",
        "service": "Tourism Emergency Response System",
        "chromadb": chroma_status,
        "knowledge_base": "tourism_emergency_knowledge",
        "timestamp": time.time(),
        "endpoints": {
            "voice": "/voice",
            "test": "/test_tourism",
            "webhook_test": "/test_webhook"
        }
    })

@app.route("/test_webhook", methods=["GET", "POST"])
def test_webhook():
    """Simple test endpoint to verify the server is responsive"""
    request_data = {
        "method": request.method,
        "url": request.url,
        "headers": dict(request.headers),
        "form_data": request.form.to_dict() if request.form else {},
        "query_params": request.args.to_dict() if request.args else {}
    }
    
    return jsonify({
        "status": "success",
        "message": "Tourism Emergency Webhook test endpoint is working",
        "service_type": "tourism_emergency_response",
        "timestamp": time.time(),
        "request_data": request_data
    })

# Emergency information export endpoint for integration with SIH system
@app.route("/export_emergency/<call_sid>", methods=["GET"])
def export_emergency_data(call_sid):
    """Export emergency data in format compatible with SIH system"""
    if call_sid in sessions:
        session_data = sessions[call_sid]
        
        # Format for SIH system integration
        sih_formatted_data = {
            "digital_id": session_data["emergency_info"].get("digital_id"),
            "alert_type": "sos" if session_data["emergency_info"]["emergency_type"] == "medical" else "incident",
            "location": {
                "description": session_data["emergency_info"]["location"],
                "coordinates": None  # Would be filled by GPS if available
            },
            "tourist_info": {
                "nationality": session_data["emergency_info"]["nationality"],
                "hotel": session_data["emergency_info"]["hotel_info"],
                "insurance_status": session_data["emergency_info"]["travel_insurance"]
            },
            "emergency_context": {
                "type": session_data["emergency_info"]["emergency_type"],
                "description": session_data["emergency_info"]["situation"],
                "conversation_summary": session_data["conversation_history"][-2:] if len(session_data["conversation_history"]) > 2 else session_data["conversation_history"]
            },
            "timestamp": time.time(),
            "call_reference": call_sid
        }
        
        return jsonify(sih_formatted_data)
    else:
        return jsonify({"error": "Session not found"}), 404

if __name__ == "__main__":
    # Tell Flask we're behind a proxy
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
        
    print(f"Starting Tourism Emergency Response Server on port 5000")
    print("Services available:")
    print("- Voice calls: /voice")
    print("- Test interface: /test_tourism") 
    print("- Health check: /health")
    print("- SIH integration: /export_emergency/<call_sid>")
    print("Make sure to use the HTTPS URL from ngrok for your Twilio webhook")
    app.run(debug=True, port=5000)