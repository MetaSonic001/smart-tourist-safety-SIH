// Mock Data Service for Offline/Demo Mode
// This service provides fallback data when backend APIs are unavailable

export interface MockDataConfig {
  useMockMode: boolean;
  mockDelay: number; // Simulate network delay
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class MockDataService {
  // Operator Calls API
  async getOperatorCalls(): Promise<any[]> {
    return this.delay([
      {
        id: 'call-001',
        incidentId: 'INC-2024-001',
        callerId: 'caller-001',
        callerLocation: 'Red Fort',
        callType: 'Emergency',
        priority: 'high',
        status: 'incoming',
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        operatorId: 'op-1',
        operatorName: 'Maya Singh',
        summary: 'Tourist in distress',
        actions: ['SOS', 'Dispatch'],
        audioRecording: '',
        transcription: '',
        languageDetected: 'en',
        outcome: '',
      },
      {
        id: 'call-002',
        incidentId: 'INC-2024-002',
        callerId: 'caller-002',
        callerLocation: 'Connaught Place',
        callType: 'Harassment',
        priority: 'medium',
        status: 'completed',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
        duration: 60,
        operatorId: 'op-1',
        operatorName: 'Maya Singh',
        summary: 'Harassment call handled',
        actions: ['Report', 'Dispatch'],
        audioRecording: '',
        transcription: '',
        languageDetected: 'en',
        outcome: 'Resolved',
      }
    ]);
  }
  private config: MockDataConfig = {
    useMockMode: true,
    mockDelay: 500,
  };

  private mockData = {
    incidents: [
      {
        id: 'INC-2024-001',
        title: 'Tourist Harassment at Red Fort',
        description: 'Foreign tourist reports harassment by local vendors. Immediate assistance requested.',
        type: 'harassment',
        priority: 'high',
        status: 'dispatched',
        location: 'Red Fort, Delhi',
        coordinates: [28.6562, 77.2410],
        reportedBy: 'Tourist (DID-12345)',
        reportedAt: new Date(Date.now() - 15 * 60 * 1000),
        assignedTo: 'Officer Sarah Chen',
        digitalId: 'DID-12345',
        estimatedResponse: '8 minutes',
      },
      {
        id: 'INC-2024-002',
        title: 'Pickpocket Incident - Connaught Place',
        description: 'Wallet stolen from tourist near Metro Station. CCTV footage available.',
        type: 'theft',
        priority: 'medium',
        status: 'acknowledged',
        location: 'Connaught Place Metro Station',
        coordinates: [28.6328, 77.2197],
        reportedBy: 'Hotel Staff',
        reportedAt: new Date(Date.now() - 45 * 60 * 1000),
        digitalId: 'DID-67890',
      },
    ],
    
    alerts: [
      {
        id: 'ALERT-001',
        type: 'emergency',
        title: 'Emergency SOS Alert',
        message: 'Tourist in distress at Connaught Place. Immediate response required.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        priority: 'high',
        location: 'Connaught Place',
        digitalId: 'DID-98765',
      },
      {
        id: 'ALERT-002',
        type: 'incident',
        title: 'New Incident Reported',
        message: 'Theft reported near India Gate. Assigned to Officer Chen.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        priority: 'medium',
        location: 'India Gate',
      },
    ],

    heatmap: {
      zones: [
        {
          id: 'zone-1',
          name: 'Connaught Place',
          coordinates: [[28.6328, 77.2197], [28.6340, 77.2210], [28.6320, 77.2220], [28.6308, 77.2207]],
          riskLevel: 'high',
          incidentCount: 12,
          color: '#dc2626',
        },
        {
          id: 'zone-2',
          name: 'India Gate',
          coordinates: [[28.6129, 77.2295], [28.6140, 77.2310], [28.6120, 77.2320], [28.6108, 77.2305]],
          riskLevel: 'medium',
          incidentCount: 7,
          color: '#f59e0b',
        },
        {
          id: 'zone-3',
          name: 'Red Fort',
          coordinates: [[28.6562, 77.2410], [28.6580, 77.2430], [28.6560, 77.2440], [28.6542, 77.2420]],
          riskLevel: 'low',
          incidentCount: 3,
          color: '#16a34a',
        },
      ]
    },

    tourists: [
      {
        digitalId: 'DID-12345',
        name: 'John Smith',
        nationality: 'USA',
        verificationStatus: 'verified',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2024-12-15'),
        lastSeen: new Date(Date.now() - 30 * 60 * 1000),
        consentScope: ['location', 'emergency_contact'],
      },
      {
        digitalId: 'DID-67890',
        name: 'Marie Dubois',
        nationality: 'France',
        verificationStatus: 'verified',
        issueDate: new Date('2024-02-10'),
        expiryDate: new Date('2024-11-10'),
        lastSeen: new Date(Date.now() - 60 * 60 * 1000),
        consentScope: ['location', 'itinerary'],
      },
    ],

    zones: [
      {
        id: 'zone-1',
        name: 'Connaught Place',
        status: 'unsafe',
        riskScore: 8.5,
        polygon: [[28.6328, 77.2197], [28.6340, 77.2210], [28.6320, 77.2220], [28.6308, 77.2207]],
        lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: 'zone-2',
        name: 'India Gate',
        status: 'moderate',
        riskScore: 5.2,
        polygon: [[28.6129, 77.2295], [28.6140, 77.2310], [28.6120, 77.2320], [28.6108, 77.2305]],
        lastUpdate: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: 'zone-3',
        name: 'Lodhi Gardens',
        status: 'safe',
        riskScore: 2.1,
        polygon: [[28.5934, 77.2157], [28.5950, 77.2180], [28.5920, 77.2190], [28.5904, 77.2167]],
        lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
      },
    ],

    operators: [
      {
        id: 'op-1',
        name: 'Maya Singh',
        badge: 'OPR001',
        status: 'active',
        activeCall: {
          id: 'CALL-001',
          type: 'emergency',
          startTime: new Date(Date.now() - 5 * 60 * 1000),
          location: 'Connaught Place',
          priority: 'high',
        },
        callsToday: 23,
        avgResponseTime: '45 seconds',
      },
    ],

    auditLogs: [
      {
        id: 'AUDIT-001',
        action: 'PII_ACCESS',
        user: 'Officer Sarah Chen',
        resource: 'Tourist Profile DID-12345',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'approved',
        approvedBy: 'Admin User',
      },
      {
        id: 'AUDIT-002',
        action: 'INCIDENT_ASSIGN',
        user: 'Dispatcher Kumar',
        resource: 'INC-2024-001',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'completed',
      },
    ],
  };

  setConfig(config: Partial<MockDataConfig>) {
    this.config = { ...this.config, ...config };
  }

  private async delay<T>(data: T): Promise<T> {
    if (this.config.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.mockDelay));
    }
    return data;
  }

  // Incidents API
  async getIncidents(filters?: any): Promise<ApiResponse<any[]>> {
    try {
      let incidents = [...this.mockData.incidents];
      
      if (filters?.status && filters.status !== 'all') {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      
      if (filters?.priority && filters.priority !== 'all') {
        incidents = incidents.filter(i => i.priority === filters.priority);
      }

      return this.delay({
        success: true,
        data: incidents,
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch incidents',
      };
    }
  }

  async getIncident(id: string): Promise<ApiResponse<any>> {
    try {
      const incident = this.mockData.incidents.find(i => i.id === id);
      if (!incident) {
        return {
          success: false,
          data: null,
          error: 'Incident not found',
        };
      }

      return this.delay({
        success: true,
        data: incident,
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to fetch incident',
      };
    }
  }

  // Heatmap API
  async getHeatmapData(params?: any): Promise<ApiResponse<any>> {
    try {
      return this.delay({
        success: true,
        data: this.mockData.heatmap,
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to fetch heatmap data',
      };
    }
  }

  // Digital ID API
  async getDigitalIds(): Promise<any[]> {
    // Return mock digital IDs in the format expected by DigitalIds.tsx
    // Map tourists to DigitalId objects
    return this.delay([
      {
        digitalId: 'DID-12345',
        status: 'verified',
        issueDate: '2024-01-15',
        expiryDate: '2024-12-15',
        nationality: 'USA',
        visaType: 'Tourist',
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        location: 'Red Fort, Delhi',
        verificationCount: 2,
        blockchainTx: 'TX-abc123',
        consentScope: ['location', 'emergency_contact'],
        itinerary: [
          { location: 'Red Fort', date: '2024-09-15' },
          { location: 'Connaught Place', date: '2024-09-16' }
        ],
      },
      {
        digitalId: 'DID-67890',
        status: 'pending',
        issueDate: '2024-02-10',
        expiryDate: '2024-11-10',
        nationality: 'France',
        visaType: 'Tourist',
        lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        location: 'Connaught Place Metro Station',
        verificationCount: 1,
        blockchainTx: 'TX-def456',
        consentScope: ['location', 'itinerary'],
        pendingReason: 'Awaiting document verification',
        itinerary: [
          { location: 'India Gate', date: '2024-09-17' }
        ],
      },
      {
        digitalId: 'DID-98765',
        status: 'flagged',
        issueDate: '2024-03-05',
        expiryDate: '2024-10-05',
        nationality: 'India',
        visaType: 'Business',
        lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        location: 'Connaught Place',
        verificationCount: 0,
        blockchainTx: 'TX-ghi789',
        consentScope: ['location'],
        flagReason: 'Suspicious activity detected',
      }
    ]);
  }
  async verifyDigitalId(digitalId: string): Promise<ApiResponse<any>> {
    try {
      const tourist = this.mockData.tourists.find(t => t.digitalId === digitalId);
      
      if (!tourist) {
        return {
          success: false,
          data: null,
          error: 'Digital ID not found',
        };
      }

      return this.delay({
        success: true,
        data: {
          ...tourist,
          blockchainStatus: 'verified',
          transactionId: `TX-${Math.random().toString(36).substr(2, 9)}`,
          verifiedAt: new Date(),
        },
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to verify digital ID',
      };
    }
  }

  // Zones API
  async getZones(): Promise<ApiResponse<any[]>> {
    try {
      return this.delay({
        success: true,
        data: this.mockData.zones,
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch zones',
      };
    }
  }

  // Audit Logs API
  async getAuditLogs(filters?: any): Promise<ApiResponse<any[]>> {
    try {
      return this.delay({
        success: true,
        data: this.mockData.auditLogs,
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch audit logs',
      };
    }
  }

  // WebSocket simulation
  simulateWebSocketEvent(): any {
    const eventTypes = ['incident.created', 'alert.created', 'risk.updated', 'sos.triggered'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const events: Record<string, any> = {
      'incident.created': {
        type: 'incident.created',
        data: {
          id: `INC-${Date.now()}`,
          title: 'New Incident Reported',
          priority: 'medium',
          location: 'Random Location',
          timestamp: new Date(),
        },
      },
      'alert.created': {
        type: 'alert.created',
        data: {
          id: `ALERT-${Date.now()}`,
          title: 'Security Alert',
          type: 'warning',
          location: 'Alert Location',
          timestamp: new Date(),
        },
      },
      'risk.updated': {
        type: 'risk.updated',
        data: {
          zoneId: 'zone-1',
          newRiskLevel: 'high',
          timestamp: new Date(),
        },
      },
      'sos.triggered': {
        type: 'sos.triggered',
        data: {
          digitalId: `DID-${Math.random().toString(36).substr(2, 5)}`,
          location: 'Emergency Location',
          timestamp: new Date(),
          priority: 'emergency',
        },
      },
    };

    return events[randomType];
  }
}

export const mockDataService = new MockDataService();