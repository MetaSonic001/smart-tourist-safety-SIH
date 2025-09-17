# Dashboard Aggregator Microservice

Authority UI Backend - Read-optimized dashboard with real-time updates via WebSocket.

## Purpose

The Dashboard Aggregator provides pre-computed views and real-time updates for authority dashboard UIs:
- **Heatmaps**: Aggregated tourist checkin and alert data in tile format
- **Active Incidents**: Real-time incident status and prioritization  
- **Recent Alerts**: Latest security and safety alerts
- **Audit Logs**: PII access tracking with blockchain anchoring
- **Real-time Updates**: WebSocket events for live dashboard updates

## Features

### Core Functionality
- **Read-optimized**: Pre-computed heatmap tiles updated hourly
- **Real-time**: WebSocket `/ws/events` for live updates to dashboard clients
- **Admin Actions**: Proxy zone status updates and PII access approvals
- **Audit Trail**: Complete access logging with optional blockchain anchoring
- **RBAC Security**: Keycloak JWT validation with role-based access

### Data Processing
- **Redis Pub/Sub**: Subscribes to `tourist.checkin`, `alert.created`, `incident.created`, `risk.updated`, `blockchain.tx.confirmed`
- **Heatmap Tiles**: Hourly aggregation job creates location-based tiles with risk levels
- **Event Broadcasting**: Real-time WebSocket updates to connected dashboard clients

## API Endpoints

### Dashboard Data (Authenticated)
```bash
GET /api/dashboard/heatmap?hours=24    # Get heatmap tiles
GET /api/dashboard/alerts?limit=50     # Get recent alerts  
GET /api/dashboard/incidents           # Get active incidents
GET /api/dashboard/audit?limit=100     # Get audit logs (admin only)
```

### Admin Actions (Admin Role Required)
```bash
POST /api/admin/zone/status            # Mark zone unsafe
POST /api/admin/pii/access            # Approve PII access request
```

### WebSocket
```bash
WS /ws/events                         # Real-time event stream
```

## Environment Variables

```bash
SERVICE_PORT=8006
DATABASE_URL=postgresql://user:pass@localhost/dashboard_db
REDIS_URL=redis://localhost:6379
BLOCKCHAIN_URL=http://localhost:8004
AUTH_URL=http://localhost:8080
ML_SERVICE_URL=http://localhost:8002
TOURIST_PROFILE_URL=http://localhost:8001
```

## Database Schema

### Heatmap Tiles
```sql
CREATE TABLE heatmap_tiles (
    tile_id VARCHAR PRIMARY KEY,       -- Grid coordinate (lat_lon bucket)
    from_ts TIMESTAMP NOT NULL,        -- Time range start
    to_ts TIMESTAMP NOT NULL,          -- Time range end  
    count INTEGER DEFAULT 0,           -- Number of events in tile
    avg_risk FLOAT DEFAULT 0.0,        -- Average risk score
    top_incident_types JSONB           -- Most common incident types
);
```

### Audit Access
```sql
CREATE TABLE audit_access (
    audit_id VARCHAR PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    user_id VARCHAR NOT NULL,          -- Who made the request
    service VARCHAR NOT NULL,          -- Which service was accessed
    action VARCHAR NOT NULL,           -- What action was taken
    subject_id VARCHAR,                -- Subject of the access (tourist ID, etc.)
    blockchain_tx VARCHAR              -- Blockchain transaction hash
);
```

## Quick Start

### Docker Compose
```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Check health
curl http://localhost:8006/health
```

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost/dashboard_db"
export REDIS_URL="redis://localhost:6379"

# Run service
python main.py
```

## React/Next.js Integration

### WebSocket Hook for Real-time Updates

```typescript
// hooks/useRealtimeEvents.ts
import { useEffect, useState, useRef } from 'react';

interface DashboardEvent {
  type: string;
  data: any;
  timestamp: string;
}

export const useRealtimeEvents = (token: string) => {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      ws.current = new WebSocket('ws://localhost:8006/ws/events');
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 events
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  return { events, isConnected };
};
```

### Dashboard API Hook

```typescript
// hooks/useDashboardData.ts
import { useState, useEffect } from 'react';

interface HeatmapTile {
  tile_id: string;
  from_ts: string;
  to_ts: string;
  count: number;
  avg_risk: number;
  top_incident_types: string[];
}

interface Alert {
  alert_id: string;
  timestamp: string;
  location: { lat: number; lon: number };
  severity: string;
  message: string;
  incident_type: string;
}

interface Incident {
  incident_id: string;
  timestamp: string;
  location: { lat: number; lon: number };
  status: string;
  incident_type: string;
  priority: string;
}

export const useDashboardData = (token: string) => {
  const [heatmapTiles, setHeatmapTiles] = useState<HeatmapTile[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [heatmapRes, alertsRes, incidentsRes] = await Promise.all([
        fetch('http://localhost:8006/api/dashboard/heatmap?hours=24', { headers }),
        fetch('http://localhost:8006/api/dashboard/alerts?limit=50', { headers }),
        fetch('http://localhost:8006/api/dashboard/incidents', { headers }),
      ]);

      const heatmapData = await heatmapRes.json();
      const alertsData = await alertsRes.json();
      const incidentsData = await incidentsRes.json();

      setHeatmapTiles(heatmapData.tiles);
      setAlerts(alertsData.alerts);
      setIncidents(incidentsData.incidents);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  return {
    heatmapTiles,
    alerts,
    incidents,
    loading,
    refresh: fetchData,
  };
};
```

### Dashboard Component Example

```tsx
// components/Dashboard.tsx
import React, { useState } from 'react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { useDashboardData } from '../hooks/useDashboardData';

interface DashboardProps {
  token: string;
  userRole: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, userRole }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Hooks for data and real-time updates
  const { heatmapTiles, alerts, incidents, loading, refresh } = useDashboardData(token);
  const { events, isConnected } = useRealtimeEvents(token);

  // Update data when new events arrive
  React.useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      if (['alert_created', 'incident_created'].includes(latestEvent.type)) {
        refresh(); // Refresh data when new alerts/incidents arrive
      }
    }
  }, [events, refresh]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Authority Dashboard</h1>
        <div className="status-indicators">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Live' : '🔴 Disconnected'}
          </span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={selectedTab === 'heatmap' ? 'active' : ''}
          onClick={() => setSelectedTab('heatmap')}
        >
          Heatmap
        </button>
        <button 
          className={selectedTab === 'incidents' ? 'active' : ''}
          onClick={() => setSelectedTab('incidents')}
        >
          Incidents ({incidents.length})
        </button>
        {userRole === 'admin' && (
          <button 
            className={selectedTab === 'admin' ? 'active' : ''}
            onClick={() => setSelectedTab('admin')}
          >
            Admin
          </button>
        )}
      </nav>

      <main className="dashboard-content">
        {selectedTab === 'overview' && (
          <OverviewTab 
            alerts={alerts} 
            incidents={incidents} 
            recentEvents={events.slice(0, 10)} 
          />
        )}
        {selectedTab === 'heatmap' && (
          <HeatmapTab tiles={heatmapTiles} />
        )}
        {selectedTab === 'incidents' && (
          <IncidentsTab incidents={incidents} />
        )}
        {selectedTab === 'admin' && userRole === 'admin' && (
          <AdminTab token={token} />
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  alerts: any[];
  incidents: any[];
  recentEvents: any[];
}> = ({ alerts, incidents, recentEvents }) => (
  <div className="overview-grid">
    <div className="stats-cards">
      <div className="stat-card">
        <h3>Active Incidents</h3>
        <div className="stat-value">{incidents.length}</div>
      </div>
      <div className="stat-card">
        <h3>Recent Alerts</h3>
        <div className="stat-value">{alerts.length}</div>
      </div>
      <div className="stat-card">
        <h3>High Priority</h3>
        <div className="stat-value">
          {incidents.filter(i => i.priority === 'high').length}
        </div>
      </div>
    </div>

    <div className="recent-events">
      <h3>Live Events</h3>
      <div className="events-list">
        {recentEvents.map((event, index) => (
          <div key={index} className="event-item">
            <span className="event-type">{event.type}</span>
            <span className="event-time">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="alerts-panel">
      <h3>Latest Alerts</h3>
      <div className="alerts-list">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.alert_id} className={`alert-item severity-${alert.severity}`}>
            <div className="alert-header">
              <span className="alert-type">{alert.incident_type}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="alert-message">{alert.message}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Heatmap Tab Component  
const HeatmapTab: React.FC<{ tiles: any[] }> = ({ tiles }) => (
  <div className="heatmap-container">
    <div className="heatmap-controls">
      <select>
        <option value="24">Last 24 hours</option>
        <option value="168">Last 7 days</option>
        <option value="720">Last 30 days</option>
      </select>
    </div>
    <div className="heatmap-grid">
      {tiles.map((tile) => (
        <div 
          key={tile.tile_id}
          className="heatmap-tile"
          style={{
            opacity: Math.min(tile.avg_risk, 1),
            backgroundColor: tile.avg_risk > 0.7 ? '#ff4444' : 
                           tile.avg_risk > 0.4 ? '#ffaa00' : '#44ff44'
          }}
          title={`Risk: ${tile.avg_risk.toFixed(2)}, Events: ${tile.count}`}
        >
          {tile.count}
        </div>
      ))}
    </div>
  </div>
);

// Admin Tab Component
const AdminTab: React.FC<{ token: string }> = ({ token }) => {
  const [zoneId, setZoneId] = useState('');
  const [reason, setReason] = useState('');

  const markZoneUnsafe = async () => {
    try {
      const response = await fetch('http://localhost:8006/api/admin/zone/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone_id: zoneId,
          unsafe: true,
          reason: reason,
        }),
      });

      if (response.ok) {
        alert('Zone marked as unsafe');
        setZoneId('');
        setReason('');
      } else {
        alert('Failed to update zone status');
      }
    } catch (error) {
      console.error('Error updating zone status:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-section">
        <h3>Zone Management</h3>
        <div className="form-group">
          <input
            type="text"
            placeholder="Zone ID"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button onClick={markZoneUnsafe}>Mark Zone Unsafe</button>
        </div>
      </div>
    </div>
  );
};
```

### Styling (CSS)

```css
/* dashboard.css */
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1a1a1a;
  color: white;
}

.connection-status.connected {
  color: #4ade80;
}

.connection-status.disconnected {
  color: #ef4444;
}

.dashboard-nav {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.dashboard-nav button {
  padding: 1rem 2rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.dashboard-nav button.active {
  border-bottom-color: #3b82f6;
  color: #3b82f6;
}

.dashboard-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.stats-cards {
  display: flex;
  gap: 1rem;
}

.stat-card {
  flex: 1;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #3b82f6;
}

.events-list, .alerts-list {
  max-height: 300px;
  overflow-y: auto;
}

.event-item, .alert-item {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
}

.alert-item.severity-high {
  border-left: 4px solid #ef4444;
}

.alert-item.severity-medium {
  border-left: 4px solid #f59e0b;
}

.alert-item.severity-low {
  border-left: 4px solid #10b981;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 2px;
  margin-top: 1rem;
}

.heatmap-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.admin-panel {
  max-width: 600px;
}

.form-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.form-group button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## Usage Example

```tsx
// pages/dashboard.tsx (Next.js)
import { useEffect, useState } from 'react';
import { Dashboard } from '../components/Dashboard';

export default function DashboardPage() {
  const [token, setToken] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get token from your auth system (Keycloak, etc.)
    const storedToken = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('user_role');
    
    if (storedToken) {
      setToken(storedToken);
      setUserRole(storedRole || 'viewer');
    }
  }, []);

  if (!token) {
    return <div>Please log in to access the dashboard</div>;
  }

  return <Dashboard token={token} userRole={userRole} />;
}
```

## Testing

### WebSocket Connection
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8006/ws/events');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

### API Endpoints
```bash
# Test with curl (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8006/api/dashboard/heatmap

curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8006/api/dashboard/alerts
```