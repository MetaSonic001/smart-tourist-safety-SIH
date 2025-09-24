import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Search,
  Filter,
  Map,
  Settings
} from 'lucide-react';
import { mockDataService } from '@/services/mockDataService';
import { useAuth, hasPermission } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Zone {
  id: string;
  name: string;
  status: 'safe' | 'moderate' | 'unsafe' | 'restricted';
  riskScore: number;
  polygon: [number, number][];
  lastUpdate: Date;
  incidentCount: number;
  description?: string;
  responsibleOfficer?: string;
  patrolSchedule?: string;
  emergencyContacts?: string[];
  touristCount?: number;
  restrictions?: string[];
}

export const Zones = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const response = await mockDataService.getZones();
      if (response.success) {
        const zonesWithExtendedData = response.data.map((zone: any) => ({
          ...zone,
          incidentCount: Math.floor(Math.random() * 20) + 1,
          touristCount: Math.floor(Math.random() * 500) + 50,
          responsibleOfficer: ['Officer Chen', 'Officer Patel', 'Officer Kumar'][Math.floor(Math.random() * 3)],
          patrolSchedule: ['Every 2 hours', '24/7 Coverage', 'Peak hours only'][Math.floor(Math.random() * 3)],
          emergencyContacts: ['112', '100', 'Tourist Helpline'],
          restrictions: zone.status === 'restricted' ? ['No photography', 'Escort required'] : [],
          description: `Security zone covering ${zone.name} area with ${zone.status} risk level.`,
        }));
        setZones(zonesWithExtendedData);
      }
    } catch (error) {
      toast({
        title: "Error Loading Zones",
        description: "Failed to load zone data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || zone.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-success text-success-foreground';
      case 'moderate': return 'bg-warning text-warning-foreground';
      case 'unsafe': return 'bg-danger text-danger-foreground';
      case 'restricted': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4" />;
      case 'unsafe': return <AlertTriangle className="h-4 w-4" />;
      case 'restricted': return <Shield className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-danger';
    if (score >= 4) return 'text-warning';
    return 'text-success';
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateZone = () => {
    // Mock zone creation
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: 'New Security Zone',
      status: 'moderate',
      riskScore: 5.0,
      polygon: [[28.6000, 77.2000], [28.6010, 77.2010], [28.6000, 77.2020], [28.5990, 77.2010]],
      lastUpdate: new Date(),
      incidentCount: 0,
      touristCount: 0,
      responsibleOfficer: user?.name || 'Unassigned',
      patrolSchedule: 'To be defined',
      emergencyContacts: ['112'],
      restrictions: [],
      description: 'New zone created for monitoring'
    };

    setZones(prev => [newZone, ...prev]);
    setIsCreateDialogOpen(false);
    toast({
      title: "Zone Created",
      description: `Security zone "${newZone.name}" has been created successfully.`
    });
  };

  const handleUpdateZoneStatus = (zoneId: string, newStatus: 'safe' | 'moderate' | 'unsafe' | 'restricted') => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId 
        ? { ...zone, status: newStatus, lastUpdate: new Date() }
        : zone
    ));

    const zoneName = zones.find(z => z.id === zoneId)?.name;
    toast({
      title: "Zone Status Updated",
      description: `${zoneName} status changed to ${newStatus}`
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    const zoneName = zones.find(z => z.id === zoneId)?.name;
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
    toast({
      title: "Zone Deleted",
      description: `Security zone "${zoneName}" has been removed.`
    });
  };

  const canManageZones = hasPermission(user, 'zones.write') || user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zone Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage security zones with real-time risk assessment
          </p>
        </div>
        {canManageZones && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Security Zone</DialogTitle>
                <DialogDescription>
                  Define a new zone for monitoring and risk assessment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zone-name">Zone Name</Label>
                  <Input id="zone-name" placeholder="Enter zone name" />
                </div>
                <div>
                  <Label htmlFor="zone-status">Initial Status</Label>
                  <Select defaultValue="moderate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">Safe</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="unsafe">Unsafe</SelectItem>
                      <SelectItem value="restricted">Restricted Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone-description">Description</Label>
                  <Textarea id="zone-description" placeholder="Zone description and notes" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateZone}>
                    Create Zone
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search zones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="unsafe">Unsafe</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold">{zones.filter(z => z.status === 'safe').length}</div>
                <div className="text-sm text-muted-foreground">Safe Zones</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{zones.filter(z => z.status === 'moderate').length}</div>
                <div className="text-sm text-muted-foreground">Moderate Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <div>
                <div className="text-2xl font-bold">{zones.filter(z => z.status === 'unsafe').length}</div>
                <div className="text-sm text-muted-foreground">Unsafe Zones</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              <div>
                <div className="text-2xl font-bold">{zones.reduce((sum, z) => sum + (z.touristCount || 0), 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Tourists</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading zones...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No zones found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Create your first security zone to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredZones.map((zone) => (
            <Card key={zone.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(zone.status)}`}>
                      {getStatusIcon(zone.status)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{zone.name}</CardTitle>
                      <CardDescription>
                        Risk Score: <span className={`font-medium ${getRiskColor(zone.riskScore)}`}>
                          {zone.riskScore.toFixed(1)}/10
                        </span>
                        {' • '}
                        Updated {formatTimeAgo(zone.lastUpdate)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(zone.status)}>
                      {zone.status.toUpperCase()}
                    </Badge>
                    {canManageZones && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedZone(zone);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">{zone.incidentCount}</span> incidents
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">{zone.touristCount}</span> tourists
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{zone.responsibleOfficer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{zone.patrolSchedule}</span>
                  </div>
                </div>

                {zone.description && (
                  <p className="text-sm text-muted-foreground mb-4">{zone.description}</p>
                )}

                {zone.restrictions && zone.restrictions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Restrictions:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {zone.restrictions.map((restriction, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {canManageZones && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateZoneStatus(zone.id, 'safe')}
                      disabled={zone.status === 'safe'}
                    >
                      Mark Safe
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateZoneStatus(zone.id, 'unsafe')}
                      disabled={zone.status === 'unsafe'}
                    >
                      Mark Unsafe
                    </Button>
                    <Button size="sm" variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
                      View Activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};