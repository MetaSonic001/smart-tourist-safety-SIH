import { User, Zone, SafetyScore, NearbyPlace, SOSAlert, CheckIn } from '@/types';
import * as Location from 'expo-location';

class MockDataService {
  getDemoUser(): User {
    return {
      id: 'demo-user-001',
      digitalId: 'DID-1111-2222',
      name: 'Demo Tourist',
      email: 'tourist_demo@demo.local',
      phone: '+91 9876543210',
      itinerary: [
        { place: 'Shillong', duration: '3 days', description: 'Explore the Scotland of the East' },
        { place: 'Cherrapunji', duration: '1 day', description: 'Wettest place on Earth' },
        { place: 'Kaziranga', duration: '2 days', description: 'Famous for one-horned rhinoceros' },
      ],
      emergencyContacts: [
        { name: 'John Doe', phone: '+91 9876543211', relationship: 'Brother' },
        { name: 'Jane Smith', phone: '+91 9876543212', relationship: 'Friend' },
      ],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }

  getMockLocation(): Location.LocationObject {
    // Mock location in Shillong, Meghalaya
    return {
      coords: {
        latitude: 25.5788,
        longitude: 91.8933,
        altitude: 1496,
        accuracy: 10,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };
  }

  getZones(): Zone[] {
    return [
      {
        id: 'zone-001',
        name: 'Police Bazaar (Safe Zone)',
        coordinates: [
          { latitude: 25.5701, longitude: 91.8932 },
          { latitude: 25.5711, longitude: 91.8942 },
          { latitude: 25.5721, longitude: 91.8922 },
          { latitude: 25.5701, longitude: 91.8912 },
        ],
        riskLevel: 'low',
        description: 'Main commercial area with good security presence',
      },
      {
        id: 'zone-002',
        name: 'Laitumkhrah (Moderate Risk)',
        coordinates: [
          { latitude: 25.5850, longitude: 91.8850 },
          { latitude: 25.5870, longitude: 91.8870 },
          { latitude: 25.5890, longitude: 91.8850 },
          { latitude: 25.5870, longitude: 91.8830 },
        ],
        riskLevel: 'medium',
        description: 'Residential area with moderate foot traffic',
        alerts: ['Limited street lighting after 9 PM'],
      },
      {
        id: 'zone-003',
        name: 'Nongthymmai (High Risk)',
        coordinates: [
          { latitude: 25.5950, longitude: 91.9050 },
          { latitude: 25.5970, longitude: 91.9070 },
          { latitude: 25.5990, longitude: 91.9050 },
          { latitude: 25.5970, longitude: 91.9030 },
        ],
        riskLevel: 'high',
        description: 'Remote area with recent incident reports',
        alerts: ['Avoid after dark', 'Travel in groups', 'Poor mobile network coverage'],
      },
    ];
  }

  getNearbyPlaces(): NearbyPlace[] {
    return [
      {
        id: 'place-001',
        name: 'Shillong Police Station',
        type: 'police',
        coordinate: { latitude: 25.5701, longitude: 91.8932 },
        distance: 0.5,
        contact: '+91 364 2501234',
      },
      {
        id: 'place-002',
        name: 'Civil Hospital Shillong',
        type: 'hospital',
        coordinate: { latitude: 25.5668, longitude: 91.8826 },
        distance: 1.2,
        contact: '+91 364 2224042',
      },
      {
        id: 'place-003',
        name: 'Tourist Information Center',
        type: 'tourist_help',
        coordinate: { latitude: 25.5734, longitude: 91.8967 },
        distance: 0.8,
        contact: '+91 364 2500201',
      },
    ];
  }

  getSafetyScore(): SafetyScore {
    return {
      score: 85,
      riskLevel: 'low',
      reasons: [
        'Currently in safe zone (Police Bazaar)',
        'Good weather conditions',
        'Active security presence',
        'Peak tourist hours'
      ],
      modelVersion: 'demo-v1.0',
    };
  }

  getOnboardResponse() {
    const user = this.getDemoUser();
    return {
      digitalId: user.digitalId,
      touristId: user.id,
      consentHash: 'mock-consent-hash-123',
      issuedAt: user.issuedAt,
      expiresAt: user.expiresAt,
    };
  }

  createSOSResponse(): SOSAlert {
    return {
      id: `sos-${Date.now()}`,
      digitalId: 'DID-1111-2222',
      location: { latitude: 25.5788, longitude: 91.8933 },
      timestamp: new Date().toISOString(),
      status: 'active',
      type: 'manual',
      description: 'Emergency assistance requested',
    };
  }

  createCheckinResponse(): CheckIn {
    return {
      id: `checkin-${Date.now()}`,
      digitalId: 'DID-1111-2222',
      location: { latitude: 25.5788, longitude: 91.8933 },
      timestamp: new Date().toISOString(),
      source: 'manual',
      zoneName: 'Police Bazaar',
    };
  }

  getItineraries() {
    return [
      {
        id: 'itin-001',
        title: 'Meghalaya Adventure',
        duration: '7 days',
        places: ['Shillong', 'Cherrapunji', 'Mawsynram', 'Kaziranga'],
        description: 'Complete Northeast India experience',
      },
      {
        id: 'itin-002',
        title: 'Cultural Tour',
        duration: '5 days',
        places: ['Shillong', 'Dawki', 'Mawlynnong'],
        description: 'Explore local culture and traditions',
      },
    ];
  }

  getHeatmapData() {
    return [
      { lat: 25.5788, lng: 91.8933, intensity: 0.3 },
      { lat: 25.5701, lng: 91.8932, intensity: 0.1 },
      { lat: 25.5850, lng: 91.8850, intensity: 0.6 },
      { lat: 25.5950, lng: 91.9050, intensity: 0.9 },
    ];
  }

  getIncidents() {
    return [
      {
        id: 'inc-001',
        type: 'theft',
        location: { lat: 25.5950, lng: 91.9050 },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Reported theft incident',
        severity: 'medium',
      },
      {
        id: 'inc-002',
        type: 'accident',
        location: { lat: 25.5850, lng: 91.8850 },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        description: 'Traffic accident',
        severity: 'low',
      },
    ];
  }
}

export const MockDataService = new MockDataService();