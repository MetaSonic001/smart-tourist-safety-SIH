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

  // Digital IDs API
  async getDigitalIds(): Promise<any[]> {
    try {
      // Enhanced mock digital IDs data
      const enhancedDigitalIds = this.mockData.tourists.map((tourist, index) => ({
        ...tourist,
        status: ['verified', 'pending', 'flagged'][Math.floor(Math.random() * 3)],
        issueDate: tourist.issueDate.toISOString(),
        expiryDate: tourist.expiryDate.toISOString(),
        lastSeen: tourist.lastSeen.toISOString(),
        location: ['Red Fort', 'India Gate', 'Connaught Place', 'Lodhi Gardens'][index % 4],
        visaType: ['Tourist', 'Business', 'Transit'][Math.floor(Math.random() * 3)],
        verificationCount: Math.floor(Math.random() * 20) + 1,
        blockchainTx: `0x${Math.random().toString(16).substr(2, 40)}`,
        flagReason: Math.random() > 0.7 ? 'Multiple failed verification attempts' : undefined,
        pendingReason: Math.random() > 0.8 ? 'Awaiting document verification' : undefined,
        itinerary: [
          { location: 'Red Fort', date: '2024-01-16' },
          { location: 'India Gate', date: '2024-01-17' },
          { location: 'Qutub Minar', date: '2024-01-18' }
        ]
      }));

      await this.delay(enhancedDigitalIds);
      return enhancedDigitalIds;
    } catch (error) {
      console.error('Failed to fetch digital IDs:', error);
      return [];
    }
  }

  // Operator Calls API
  async getOperatorCalls(): Promise<any[]> {
    try {
      const mockCalls = [
        {
          id: 'CALL-001',
          type: 'emergency',
          priority: 'high',
          caller: 'DID-12345',
          location: 'Connaught Place',
          startTime: new Date(Date.now() - 5 * 60 * 1000),
          duration: '00:05:23',
          status: 'active',
          assignedOperator: 'Maya Singh',
          incidentId: 'INC-2024-001'
        },
        {
          id: 'CALL-002',
          type: 'assistance',
          priority: 'medium',
          caller: 'DID-67890',
          location: 'Red Fort',
          startTime: new Date(Date.now() - 15 * 60 * 1000),
          duration: '00:03:45',
          status: 'completed',
          assignedOperator: 'Raj Kumar',
          resolution: 'Provided directions to nearest metro station'
        }
      ];

      await this.delay(mockCalls);
      return mockCalls;
    } catch (error) {
      console.error('Failed to fetch operator calls:', error);
      return [];
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