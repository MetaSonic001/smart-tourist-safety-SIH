import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApiFallback } from '@/hooks/useApiFallback';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
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


// API endpoints and mock URLs
const API_BASE = '/api/dashboard';
const MOCK_BASE = '/mocks';

const endpoints = {
  stats: `${API_BASE}/stats`,
  recent: `${API_BASE}/recent`,
  zones: `${API_BASE}/zones`,
};
const mockEndpoints = {
  stats: `${MOCK_BASE}/dashboard-stats.json`,
  recent: `${MOCK_BASE}/incidents.json`,
  zones: `${MOCK_BASE}/zones.json`,
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  // API fallback hooks
  const { data: stats, error: statsError, loading: statsLoading } = useApiFallback<DashboardStats>(endpoints.stats, mockEndpoints.stats);
  const { data: recentActivity, error: recentError, loading: recentLoading } = useApiFallback<RecentActivity[]>(endpoints.recent, mockEndpoints.recent);
  const { data: riskZones, error: zonesError, loading: zonesLoading } = useApiFallback<RiskZone[]>(endpoints.zones, mockEndpoints.zones);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  // WebSocket for real-time updates
  const { status: wsStatus } = useWebSocket('wss://demo.smart-tourist-safety.com/ws/dashboard', useCallback((msg) => {
    if (msg.type === 'incident' || msg.type === 'sos') {
      toast({
        title: t('New Alert'),
        description: t(msg.payload.title || 'New incident/SOS received'),
        variant: 'destructive',
      });
      // Optionally, trigger a refresh or update state
      setLastUpdate(new Date());
    }
  }, [toast, t]));

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(timestamp).getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return t('Just now');
  if (diffInMinutes < 60) return t(`${diffInMinutes}m ago`);
  return t(`${Math.floor(diffInMinutes / 60)}h ago`);
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
    setLastUpdate(new Date());
    // Optionally, re-fetch API data by updating state or using SWR
  };

  // Remove mock real-time updates, now handled by WebSocket

  // Loading and error states
  if (statsLoading || recentLoading || zonesLoading) {
    return <div className="p-6">{t('Loading dashboard...')}</div>;
  }
  if (statsError || recentError || zonesError) {
    return <div className="p-6 text-danger">{t('Error loading dashboard data. Using mock data if available.')}</div>;
  }
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Command Dashboard')}</h1>
          <p className="text-muted-foreground">
      {t(`Welcome back, ${user?.name || ''}. Here's your operational overview.`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('Last updated')}: {formatTimeAgo(lastUpdate)}
          </span>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Refresh')}
          </Button>
        </div>
      </div>

  {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Active Incidents')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeIncidents ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t(`of ${stats?.totalIncidents ?? 0} total incidents`)}
            </p>
            <Progress 
              value={stats && stats.totalIncidents ? (stats.activeIncidents / stats.totalIncidents) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('SOS Alerts')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-emergency emergency-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emergency">{stats?.sosAlerts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('Requiring immediate response')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Digital IDs Verified')}</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verifiedIds ? stats.verifiedIds.toLocaleString() : '0'}</div>
            <p className="text-xs text-muted-foreground">
              {t('Today')}: +124 {t('new verifications')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Avg Response Time')}</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageResponseTime ?? '--'}</div>
            <p className="text-xs text-success">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {t('12% faster than last week')}
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
              {t('Recent Activity')}
            </CardTitle>
            <CardDescription>
              {t('Latest incidents, alerts, and system activities')}
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
              {t('Risk Zones')}
            </CardTitle>
            <CardDescription>
              {t('Current risk assessment by zone')}
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
                      {zone.incidentCount} {t('incidents')} • {t('Updated')} {formatTimeAgo(zone.lastUpdate)}
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
              {t('View Full Heatmap')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('System Status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <span className="text-sm font-medium">{t('API Services')}</span>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('Online')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <span className="text-sm font-medium">{t('Database')}</span>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('Healthy')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
              <span className="text-sm font-medium">{t('WebSocket')}</span>
              <Badge className="bg-warning text-warning-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {t(wsStatus === 'open' ? 'Connected' : wsStatus === 'error' ? 'Error' : 'Connecting')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};