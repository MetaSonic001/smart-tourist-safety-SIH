import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Users,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Map,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  sosAlerts: number;
  verifiedIds: number;
  averageResponseTime: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface RecentActivity {
  id: string;
  type: 'incident' | 'sos' | 'verification' | 'assignment';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'active' | 'resolved';
}

interface RiskZone {
  id: string;
  name: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  incidentCount: number;
  lastUpdate: Date;
}

// Mock data for demo
const mockStats: DashboardStats = {
  totalIncidents: 847,
  activeIncidents: 23,
  sosAlerts: 5,
  verifiedIds: 12450,
  averageResponseTime: '4.2 min',
  riskLevel: 'Medium',
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'sos',
    title: 'Emergency SOS Alert',
    description: 'Tourist in distress at Connaught Place',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    priority: 'high',
    status: 'active',
  },
  {
    id: '2',
    type: 'incident',
    title: 'Theft Reported',
    description: 'Pickpocket incident near India Gate Metro',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    priority: 'medium',
    status: 'pending',
  },
  {
    id: '3',
    type: 'verification',
    title: 'Digital ID Verified',
    description: 'Tourist ID DID-12345 successfully verified',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    priority: 'low',
    status: 'resolved',
  },
  {
    id: '4',
    type: 'assignment',
    title: 'Unit Dispatched',
    description: 'Officer Chen assigned to Karol Bagh incident',
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    priority: 'medium',
    status: 'active',
  },
];

const mockRiskZones: RiskZone[] = [
  {
    id: '1',
    name: 'Connaught Place',
    riskLevel: 'High',
    incidentCount: 12,
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Karol Bagh',
    riskLevel: 'Medium',
    incidentCount: 7,
    lastUpdate: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Chandni Chowk',
    riskLevel: 'Medium',
    incidentCount: 5,
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Lajpat Nagar',
    riskLevel: 'Low',
    incidentCount: 2,
    lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
  },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(mockRecentActivity);
  const [riskZones, setRiskZones] = useState<RiskZone[]>(mockRiskZones);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-danger bg-danger/10 border-danger/20';
      case 'Medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'Low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4 text-warning" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-info" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const refreshData = () => {
    // In real app, this would fetch from API
    setLastUpdate(new Date());
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeIncidents: prev.activeIncidents + Math.floor(Math.random() * 3) - 1,
        sosAlerts: Math.max(0, prev.sosAlerts + Math.floor(Math.random() * 2) - 1),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's your operational overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatTimeAgo(lastUpdate)}
          </span>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalIncidents} total incidents
            </p>
            <Progress 
              value={(stats.activeIncidents / stats.totalIncidents) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOS Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-emergency emergency-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emergency">{stats.sosAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate response
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Digital IDs Verified</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedIds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Today: +124 new verifications
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
            <p className="text-xs text-success">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              12% faster than last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest incidents, alerts, and system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20">
                {getStatusIcon(activity.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        activity.priority === 'high' ? 'border-danger/20 text-danger' :
                        activity.priority === 'medium' ? 'border-warning/20 text-warning' :
                        'border-success/20 text-success'
                      }`}
                    >
                      {activity.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {activity.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Zones */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Risk Zones
            </CardTitle>
            <CardDescription>
              Current risk assessment by zone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskZones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/20">
                <div className="flex items-center gap-3">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">{zone.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {zone.incidentCount} incidents • Updated {formatTimeAgo(zone.lastUpdate)}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getRiskColor(zone.riskLevel)}`}
                >
                  {zone.riskLevel}
                </Badge>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              <Map className="h-4 w-4 mr-2" />
              View Full Heatmap
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <span className="text-sm font-medium">API Services</span>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <span className="text-sm font-medium">Database</span>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
              <span className="text-sm font-medium">WebSocket</span>
              <Badge className="bg-warning text-warning-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Connecting
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};