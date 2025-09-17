export interface User {
  id: string;
  digitalId: string;
  name: string;
  email: string;
  phone?: string;
  itinerary?: ItineraryItem[];
  emergencyContacts?: EmergencyContact[];
  issuedAt: string;
  expiresAt: string;
}

export interface ItineraryItem {
  place: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Zone {
  id: string;
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  riskLevel: 'low' | 'medium' | 'high';
  description?: string;
  alerts?: string[];
}

export interface SafetyScore {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  modelVersion: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'embassy' | 'tourist_help';
  coordinate: { latitude: number; longitude: number };
  distance?: number;
  contact?: string;
}

export interface SOSAlert {
  id: string;
  digitalId: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  status: 'active' | 'resolved' | 'false_alarm';
  type: 'manual' | 'voice' | 'automatic';
  description?: string;
}

export interface CheckIn {
  id: string;
  digitalId: string;
  location: { latitude: number; longitude: number };
  timestamp: string;
  source: 'manual' | 'automatic';
  zoneName?: string;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  createdAt: Date;
  active: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}