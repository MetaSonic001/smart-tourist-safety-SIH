import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Search,
  Filter,
  Eye,
  UserCheck,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth, hasPermission } from '@/contexts/AuthContext';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'theft' | 'assault' | 'emergency' | 'harassment' | 'fraud' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'reported' | 'acknowledged' | 'dispatched' | 'resolved';
  location: string;
  coordinates: [number, number];
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  digitalId?: string;
  estimatedResponse?: string;
}

// Mock incidents data
const mockIncidents: Incident[] = [
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
  {
    id: 'INC-2024-003',
    title: 'Medical Emergency - India Gate',
    description: 'Tourist collapsed near India Gate. Ambulance requested.',
    type: 'emergency',
    priority: 'high',
    status: 'resolved',
    location: 'India Gate',
    coordinates: [28.6129, 77.2295],
    reportedBy: '112 Emergency',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assignedTo: 'Paramedic Unit 7',
  },
  {
    id: 'INC-2024-004',
    title: 'Fraudulent Tour Guide',
    description: 'Reports of unlicensed guide charging excessive fees to tourists.',
    type: 'fraud',
    priority: 'medium',
    status: 'reported',
    location: 'Chandni Chowk',
    coordinates: [28.6506, 77.2334],
    reportedBy: 'Tourist Complaint',
    reportedAt: new Date(Date.now() - 90 * 60 * 1000),
  },
];

const INCIDENT_TYPES = {
  theft: { label: 'Theft', color: 'bg-warning text-warning-foreground' },
  assault: { label: 'Assault', color: 'bg-danger text-danger-foreground' },
  emergency: { label: 'Emergency', color: 'bg-emergency text-emergency-foreground' },
  harassment: { label: 'Harassment', color: 'bg-danger text-danger-foreground' },
  fraud: { label: 'Fraud', color: 'bg-warning text-warning-foreground' },
  other: { label: 'Other', color: 'bg-secondary text-secondary-foreground' },
};

const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'bg-info text-info-foreground', icon: AlertCircle },
  acknowledged: { label: 'Acknowledged', color: 'bg-warning text-warning-foreground', icon: Clock },
  dispatched: { label: 'Dispatched', color: 'bg-primary text-primary-foreground', icon: User },
  resolved: { label: 'Resolved', color: 'bg-success text-success-foreground', icon: CheckCircle },
};

export const Incidents = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(mockIncidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    let filtered = incidents;

    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident => incident.priority === priorityFilter);
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, statusFilter, priorityFilter]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleAssignUnit = (incidentId: string) => {
    if (!hasPermission(user, 'incidents.assign')) {
      return;
    }

    setIncidents(prev => prev.map(incident =>
      incident.id === incidentId
        ? { ...incident, status: 'dispatched', assignedTo: user?.name || 'Current User' }
        : incident
    ));
  };

  const canViewDetails = hasPermission(user, 'incidents.read');
  const canAssign = hasPermission(user, 'incidents.assign');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="text-muted-foreground">
            Monitor, track, and respond to incidents across all zones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
            {filteredIncidents.length} Incidents
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents, locations, or IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const StatusIcon = STATUS_CONFIG[incident.status].icon;
            const typeConfig = INCIDENT_TYPES[incident.type];
            
            return (
              <Card 
                key={incident.id} 
                className={`cursor-pointer transition-all hover:shadow-elevated ${
                  selectedIncident?.id === incident.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedIncident(incident)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_CONFIG[incident.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[incident.status].label}
                      </Badge>
                      <Badge className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={
                          incident.priority === 'high' ? 'border-danger/20 text-danger' :
                          incident.priority === 'medium' ? 'border-warning/20 text-warning' :
                          'border-success/20 text-success'
                        }
                      >
                        {incident.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {incident.id}
                    </span>
                  </div>

                  <h3 className="font-semibold mb-2">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{incident.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatTimeAgo(incident.reportedAt)}</span>
                    </div>
                  </div>

                  {incident.assignedTo && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <UserCheck className="h-3 w-3 text-primary" />
                      <span className="text-primary">Assigned to {incident.assignedTo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Incident Details */}
        <div className="lg:sticky lg:top-4">
          {selectedIncident ? (
            <Card className="shadow-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Incident Details
                    </CardTitle>
                    <CardDescription>
                      {selectedIncident.id} • {formatTimeAgo(selectedIncident.reportedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewDetails && (
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedIncident.title}</h3>
                  <p className="text-muted-foreground">{selectedIncident.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Type</h4>
                    <Badge className={INCIDENT_TYPES[selectedIncident.type].color}>
                      {INCIDENT_TYPES[selectedIncident.type].label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Priority</h4>
                    <Badge 
                      variant="outline"
                      className={
                        selectedIncident.priority === 'high' ? 'border-danger/20 text-danger' :
                        selectedIncident.priority === 'medium' ? 'border-warning/20 text-warning' :
                        'border-success/20 text-success'
                      }
                    >
                      {selectedIncident.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedIncident.location}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Reported By</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedIncident.reportedBy}</span>
                  </div>
                </div>

                {selectedIncident.digitalId && (
                  <div>
                    <h4 className="font-medium mb-2">Digital ID</h4>
                    <Badge variant="outline" className="font-mono">
                      {selectedIncident.digitalId}
                    </Badge>
                  </div>
                )}

                {selectedIncident.assignedTo && (
                  <div>
                    <h4 className="font-medium mb-2">Assigned To</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="text-primary">{selectedIncident.assignedTo}</span>
                    </div>
                  </div>
                )}

                {canAssign && selectedIncident.status === 'reported' && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => handleAssignUnit(selectedIncident.id)}
                      className="w-full"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assign Unit
                    </Button>
                  </div>
                )}

                {selectedIncident.estimatedResponse && (
                  <div className="p-3 bg-info/10 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-info" />
                      <span className="font-medium">ETA: {selectedIncident.estimatedResponse}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an incident to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};