import { User, Zone, SafetyScore, SOSAlert, CheckIn, ApiResponse } from '@/types';
import { MockDataService } from './MockDataService';

const API_BASE_URL = 'http://localhost';
const TIMEOUT = 10000; // 10 seconds

class ApiService {
  private useMockData: boolean = false;
  
  setUseMockData(useMock: boolean) {
    this.useMockData = useMock;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    port: number = 8001
  ): Promise<ApiResponse<T>> {
    if (this.useMockData) {
      // Return mock data based on endpoint
      return this.getMockResponse<T>(endpoint);
    }

    const url = `${API_BASE_URL}:${port}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, status: 'success' };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      // Fallback to mock data on network error
      return this.getMockResponse<T>(endpoint);
    }
  }

  private getMockResponse<T>(endpoint: string): ApiResponse<T> {
    // Route to appropriate mock data based on endpoint
    if (endpoint.includes('/onboard')) {
      return { data: MockDataService.getOnboardResponse() as T, status: 'mock' };
    } else if (endpoint.includes('/zones')) {
      return { data: MockDataService.getZones() as T, status: 'mock' };
    } else if (endpoint.includes('/individual_score')) {
      return { data: MockDataService.getSafetyScore() as T, status: 'mock' };
    } else if (endpoint.includes('/sos')) {
      return { data: MockDataService.createSOSResponse() as T, status: 'mock' };
    } else if (endpoint.includes('/checkin')) {
      return { data: MockDataService.createCheckinResponse() as T, status: 'mock' };
    }
    
    return { data: {} as T, status: 'mock', message: 'Mock response' };
  }

  // Auth Service (Port 8001)
  async onboardUser(data: {
    docToken?: string;
    itinerary: any[];
    emergencyContacts: any[];
  }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/api/onboard/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 8001);
  }

  // Blockchain Service (Port 8002)
  async verifyDigitalId(digitalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/api/verify_did?digital_id=${digitalId}`, {}, 8002);
  }

  // Tourist Profile Service (Port 8003)
  async checkin(data: {
    digitalId: string;
    lat: number;
    lng: number;
    timestamp: string;
    source: string;
  }): Promise<ApiResponse<CheckIn>> {
    return this.makeRequest<CheckIn>('/api/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 8003);
  }

  async getProfile(digitalId: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/api/profile/${digitalId}`, {}, 8003);
  }

  // ML Service (Port 8004)
  async getIndividualScore(data: {
    digitalId: string;
    features: any;
  }): Promise<ApiResponse<SafetyScore>> {
    return this.makeRequest<SafetyScore>('/api/ml/individual_score', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 8004);
  }

  async getZoneScore(data: {
    lat: number;
    lng: number;
    timestamp: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/ml/zone_score', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 8004);
  }

  // Alerts Service (Port 8005)
  async createSOS(data: {
    alertId: string;
    digitalId: string;
    touristId: string;
    lat: number;
    lng: number;
    timestamp: string;
    source: string;
    mediaRefs: string[];
  }): Promise<ApiResponse<SOSAlert>> {
    return this.makeRequest<SOSAlert>('/api/alerts/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 8005);
  }

  // Dashboard Service (Port 8006)
  async getZones(): Promise<ApiResponse<Zone[]>> {
    return this.makeRequest<Zone[]>('/api/zones', {}, 8006);
  }

  // Operator Service (Port 8007)
  async getIncidents(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/incidents', {}, 8007);
  }
}

export const ApiService = new ApiService();