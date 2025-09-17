import chromadb
import os
import json
from chromadb.utils import embedding_functions
import pandas as pd

# Initialize ChromaDB
client = chromadb.PersistentClient("./chroma_db")
embedding_function = embedding_functions.DefaultEmbeddingFunction()

# Delete existing collection if it exists (for clean slate during setup)
try:
    client.delete_collection("tourism_emergency_knowledge")
    print("Deleted existing collection")
except:
    print("No existing collection to delete")

# Create collection
collection = client.create_collection(
    name="tourism_emergency_knowledge",
    embedding_function=embedding_function,
    metadata={"description": "Tourism emergency response information for India"}
)

# Define tourism emergency response knowledge base
tourism_emergency_knowledge = [
    # General Tourist Safety
    {
        "text": "For tourists reporting feeling lost or disoriented, ask for their current location using landmarks, nearby signs, or GPS coordinates. Ask if they have their hotel address, tour group contact, or embassy information. Instruct them to stay in a safe, well-lit public area.",
        "metadata": {
            "type": "tourist_assistance",
            "source": "Tourist Safety Protocol",
            "priority": "medium",
            "category": "lost_tourist"
        }
    },
    {
        "text": "When a tourist reports theft or robbery, ask if they are currently safe, what was stolen (passport, money, phone, etc.), and exact location. If passport was stolen, they need to contact their embassy immediately. Advise to file police report and avoid confronting thieves.",
        "metadata": {
            "type": "crime_tourist",
            "source": "Tourist Crime Response",
            "priority": "high",
            "category": "theft_robbery"
        }
    },
    {
        "text": "For tourists experiencing food poisoning or traveler's diarrhea, ask about symptoms severity, what they ate recently, if they're vomiting, and if they can stay hydrated. Advise to drink bottled water, avoid dairy, and seek medical help if symptoms worsen.",
        "metadata": {
            "type": "medical_tourist",
            "source": "Tourist Health Guide",
            "priority": "medium",
            "category": "food_illness"
        }
    },
    
    # Hotel and Accommodation Emergencies
    {
        "text": "For hotel emergencies, ask the tourist for hotel name, room number, and nature of emergency. If fire, instruct to evacuate immediately using stairs, feel doors before opening. If medical emergency in hotel, hotel staff can assist with local hospital contacts.",
        "metadata": {
            "type": "accommodation",
            "source": "Hotel Emergency Protocol",
            "priority": "high",
            "category": "hotel_emergency"
        }
    },
    {
        "text": "If tourist reports unsafe accommodation conditions (broken locks, suspicious activity, harassment), advise them to leave immediately if safe to do so, contact hotel management, and find alternative accommodation. Assist in contacting tourist helpline or embassy if needed.",
        "metadata": {
            "type": "accommodation",
            "source": "Tourist Safety Protocol",
            "priority": "high",
            "category": "unsafe_accommodation"
        }
    },
    
    # Transportation Emergencies
    {
        "text": "For tourists in taxi or transport-related emergencies, ask if they're currently safe, note the vehicle details (license plate, driver ID), and their destination. If they feel threatened, instruct to call attention of other people or exit at next safe stop.",
        "metadata": {
            "type": "transport",
            "source": "Transport Safety Guide",
            "priority": "high",
            "category": "transport_emergency"
        }
    },
    {
        "text": "When tourist misses flight or train, ask for their ticket details, travel insurance status, and onward travel plans. Guide them to airline/railway customer service, and help them contact accommodation if needed for extended stay.",
        "metadata": {
            "type": "transport",
            "source": "Travel Disruption Protocol",
            "priority": "medium",
            "category": "missed_transport"
        }
    },
    {
        "text": "For tourists stranded due to natural disasters (floods, storms, strikes), ask their current location, safety status, and available resources (food, water, shelter). Connect them with local disaster management authorities and embassy if needed.",
        "metadata": {
            "type": "disaster_tourist",
            "source": "Tourist Disaster Response",
            "priority": "high",
            "category": "natural_disaster"
        }
    },
    
    # Medical Emergencies for Tourists
    {
        "text": "For tourist medical emergencies, first ask about immediate symptoms and consciousness. Ask if they have travel insurance, medical conditions, or medications. Guide them to nearest hospital - many private hospitals in tourist areas have English-speaking staff.",
        "metadata": {
            "type": "medical_tourist",
            "source": "Tourist Medical Protocol",
            "priority": "high",
            "category": "medical_emergency"
        }
    },
    {
        "text": "If tourist reports severe allergic reaction or anaphylaxis, ask if they have epinephrine auto-injector, what caused the reaction, and their breathing status. Instruct to use epi-pen if available and get to hospital immediately. Many tourist areas stock anti-histamines.",
        "metadata": {
            "type": "medical_tourist",
            "source": "Allergy Emergency Guide",
            "priority": "high",
            "category": "allergic_reaction"
        }
    },
    {
        "text": "For heat exhaustion or heat stroke in tourists, ask about symptoms (confusion, high temperature, sweating status), move them to shade or air conditioning, provide water if conscious, and cool with wet cloths. Tourist areas often have first aid stations.",
        "metadata": {
            "type": "medical_tourist",
            "source": "Heat Emergency Protocol",
            "priority": "high",
            "category": "heat_emergency"
        }
    },
    
    # Tourist Scam and Fraud
    {
        "text": "When tourist reports being scammed, ask what type of scam (fake police, gem scam, overcharging), if money was already lost, and if they're currently safe. Advise to never give money to unofficial people claiming to be police or officials.",
        "metadata": {
            "type": "fraud_tourist",
            "source": "Tourist Fraud Prevention",
            "priority": "medium",
            "category": "tourist_scam"
        }
    },
    {
        "text": "For credit card fraud or ATM skimming reports from tourists, instruct to immediately contact their bank, block cards, and note the ATM location. Many tourist areas have bank branches that can assist with international card issues.",
        "metadata": {
            "type": "fraud_tourist",
            "source": "Financial Fraud Protocol",
            "priority": "high",
            "category": "card_fraud"
        }
    },
    
    # Cultural and Language Barriers
    {
        "text": "For tourists experiencing language barriers during emergencies, speak slowly and use simple English. Use universal emergency signs (pointing to hospital symbol, calling gesture). Many tourist police and hospital staff speak basic English.",
        "metadata": {
            "type": "communication",
            "source": "Language Barrier Protocol",
            "priority": "medium",
            "category": "language_barrier"
        }
    },
    {
        "text": "When tourist reports cultural misunderstanding or offense, assess if it involves legal issues, explain local customs respectfully, and if serious, connect with tourist helpline or embassy cultural liaison officers.",
        "metadata": {
            "type": "cultural",
            "source": "Cultural Sensitivity Guide",
            "priority": "medium",
            "category": "cultural_issue"
        }
    },
    
    # Wildlife and Adventure Tourism
    {
        "text": "For wildlife encounters during safari or trekking, ask tourist's exact location, animal type, and if anyone is injured. Instruct to remain calm, not run suddenly, and contact local forest department or park authorities immediately.",
        "metadata": {
            "type": "wildlife",
            "source": "Wildlife Emergency Protocol",
            "priority": "high",
            "category": "wildlife_encounter"
        }
    },
    {
        "text": "For adventure tourism accidents (trekking, water sports), ask about injuries, exact location, group size, and available first aid. Contact local rescue services - many tourist areas have specialized rescue teams for adventure activities.",
        "metadata": {
            "type": "adventure",
            "source": "Adventure Tourism Safety",
            "priority": "high",
            "category": "adventure_accident"
        }
    },
    {
        "text": "If tourist reports getting lost during trekking or hiking, ask for last known location, weather conditions, available supplies, and group members. Instruct to stay put, conserve energy, and use whistle or phone flashlight for signaling rescue teams.",
        "metadata": {
            "type": "adventure",
            "source": "Trekking Emergency Guide",
            "priority": "high",
            "category": "lost_trekking"
        }
    },
    
    # Embassy and Consular Issues
    {
        "text": "For passport loss or emergency travel document needs, note tourist's nationality, current location, and travel plans. Provide nearest embassy/consulate contact information and advise to file police report for lost passport before visiting embassy.",
        "metadata": {
            "type": "documentation",
            "source": "Embassy Assistance Protocol",
            "priority": "high",
            "category": "passport_issues"
        }
    },
    {
        "text": "When tourist faces legal trouble or arrest, advise them of right to contact embassy, not to sign documents they don't understand, and to remain calm. Contact tourist helpline which can coordinate with embassy assistance.",
        "metadata": {
            "type": "legal",
            "source": "Tourist Legal Assistance",
            "priority": "high",
            "category": "legal_trouble"
        }
    },
    
    # Accommodation and Booking Issues
    {
        "text": "For accommodation booking disputes or overcharging, ask for booking confirmation details, amount disputed, and payment method used. Guide them to tourist helpline or consumer forum, and advise to keep all receipts and booking confirmations.",
        "metadata": {
            "type": "commercial",
            "source": "Tourist Commercial Disputes",
            "priority": "medium",
            "category": "booking_dispute"
        }
    },
    
    # Mental Health and Psychological Support
    {
        "text": "For tourists experiencing panic attacks or severe anxiety, speak calmly, ask them to focus on breathing slowly, find a quiet safe space to sit. Many tourist areas have English-speaking counselors or medical facilities that can provide immediate support.",
        "metadata": {
            "type": "mental_health",
            "source": "Tourist Psychological Support",
            "priority": "medium",
            "category": "panic_anxiety"
        }
    },
    {
        "text": "If tourist reports feeling overwhelmed or homesick to a dangerous degree, listen empathetically, ask about support systems, and connect them with embassy welfare officers or international helplines that provide psychological support to travelers.",
        "metadata": {
            "type": "mental_health",
            "source": "Tourist Welfare Protocol",
            "priority": "medium",
            "category": "emotional_distress"
        }
    },
    
    # Technology and Communication Issues
    {
        "text": "For tourists with phone/internet connectivity issues during emergencies, guide them to nearest internet café, hotel lobby, or tourist information center. Many airports and railway stations have free WiFi for emergency communications.",
        "metadata": {
            "type": "communication",
            "source": "Tourist Communication Protocol",
            "priority": "medium",
            "category": "connectivity_issues"
        }
    },
    
    # Weather and Environmental Emergencies
    {
        "text": "During monsoon emergencies affecting tourists, ask about their location safety, water levels, and shelter availability. Guide them to higher ground, avoid walking through flood water, and contact local disaster management for evacuation if needed.",
        "metadata": {
            "type": "weather",
            "source": "Monsoon Emergency Protocol",
            "priority": "high",
            "category": "monsoon_emergency"
        }
    },
    {
        "text": "For tourists caught in extreme weather (cyclones, storms), instruct to stay indoors, avoid windows, stock water and non-perishable food. Contact hotel management or local authorities for official weather updates and evacuation procedures.",
        "metadata": {
            "type": "weather",
            "source": "Extreme Weather Protocol",
            "priority": "high",
            "category": "extreme_weather"
        }
    },
    
    # Group Tour Emergencies
    {
        "text": "When tourist gets separated from tour group, ask for tour company name, guide contact, last location with group, and planned itinerary. Advise to return to last common location or contact tour company directly. Many tour operators have 24/7 emergency contacts.",
        "metadata": {
            "type": "tour_group",
            "source": "Group Tour Safety Protocol",
            "priority": "medium",
            "category": "separated_from_group"
        }
    },
    {
        "text": "For accidents involving tour groups, ask about number of people affected, tour operator details, and insurance coverage. Contact tour operator emergency line and ensure medical help reaches the location. Tour operators usually have emergency response protocols.",
        "metadata": {
            "type": "tour_group",
            "source": "Tour Group Emergency Response",
            "priority": "high",
            "category": "group_accident"
        }
    },
    
    # Special Tourist Categories
    {
        "text": "For elderly tourists in emergencies, speak clearly, ask about medications they need, existing health conditions, and emergency contacts. Many tourist areas have senior-friendly medical facilities and can assist with medication access.",
        "metadata": {
            "type": "special_needs",
            "source": "Elderly Tourist Protocol",
            "priority": "high",
            "category": "elderly_tourist"
        }
    },
    {
        "text": "For solo female traveler emergencies, prioritize immediate safety, ask if they feel threatened, provide women's helpline numbers, and connect with female police officers when possible. Many cities have dedicated women's safety services.",
        "metadata": {
            "type": "special_needs",
            "source": "Women's Safety Protocol",
            "priority": "high",
            "category": "solo_female_traveler"
        }
    },
    {
        "text": "For tourists with disabilities facing accessibility emergencies, ask about specific needs, mobility equipment status, and current safety. Many tourist facilities have disability support services, and specialized transport may be required.",
        "metadata": {
            "type": "special_needs",
            "source": "Disability Support Protocol",
            "priority": "high",
            "category": "accessibility_emergency"
        }
    },
    
    # Digital ID and Blockchain Verification
    {
        "text": "When tourist mentions having Digital ID from Smart Tourist Safety system, ask for their Digital ID reference and consent for accessing their travel information. This can help locate their itinerary, emergency contacts, and risk assessment data quickly.",
        "metadata": {
            "type": "digital_id",
            "source": "SIH Digital ID Protocol",
            "priority": "high",
            "category": "digital_verification"
        }
    },
    {
        "text": "For tourists registered in Smart Tourist Safety system, their location preferences and emergency contact information may be available through blockchain verification. Always confirm consent before accessing personal information during emergencies.",
        "metadata": {
            "type": "digital_id",
            "source": "SIH Privacy Protocol",
            "priority": "medium",
            "category": "privacy_consent"
        }
    },
    
    # Coordination with Tourist Services
    {
        "text": "Tourist helpline numbers for India: 1363 (24/7 multilingual). Many states have dedicated tourist police with English-speaking officers. Always provide both 112 and 1363 numbers for comprehensive support.",
        "metadata": {
            "type": "resources",
            "source": "Tourist Services Directory",
            "priority": "medium",
            "category": "helpline_numbers"
        }
    },
    {
        "text": "Major cities have Tourist Facilitation Centers at airports, railway stations, and popular tourist spots. These centers can provide immediate assistance, local contacts, and coordinate with emergency services for tourist-specific issues.",
        "metadata": {
            "type": "resources",
            "source": "Tourist Infrastructure Guide",
            "priority": "medium",
            "category": "tourist_facilities"
        }
    }
]

# Add documents to collection
collection.add(
    documents=[item["text"] for item in tourism_emergency_knowledge],
    metadatas=[item["metadata"] for item in tourism_emergency_knowledge],
    ids=[f"tourism_doc_{i}" for i in range(len(tourism_emergency_knowledge))]
)

print(f"Added {len(tourism_emergency_knowledge)} tourism emergency documents to the knowledge base")

# Test query to verify the collection is working
results = collection.query(
    query_texts=["Tourist lost passport in Delhi"],
    n_results=3
)

print("\nTest Query Results for 'Tourist lost passport in Delhi':")
for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
    print(f"\nResult {i+1}:")
    print(f"Category: {metadata.get('category', 'N/A')}")
    print(f"Text: {doc[:200]}...")
    print(f"Priority: {metadata.get('priority', 'N/A')}")

print("\nTourism emergency knowledge base setup complete!")
print("\nKnowledge base covers:")
print("- General tourist safety and assistance")
print("- Hotel and accommodation emergencies")
print("- Transportation issues")
print("- Medical emergencies for tourists")
print("- Tourist scams and fraud")
print("- Cultural and language barriers")
print("- Wildlife and adventure tourism")
print("- Embassy and consular issues")
print("- Mental health support")
print("- Weather emergencies")
print("- Group tour emergencies")
print("- Special needs (elderly, solo female, disabled)")
print("- Digital ID integration")
print("- Tourist service coordination")