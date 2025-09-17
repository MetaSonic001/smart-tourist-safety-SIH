import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Eye, 
  FileText, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Database,
  Lock,
  Activity,
  Hash,
  Clipboard
} from 'lucide-react';
import { mockDataService } from '@/services/mockDataService';
import { useAuth, hasPermission } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  action: 'PII_ACCESS' | 'INCIDENT_ASSIGN' | 'ZONE_UPDATE' | 'LOGIN' | 'EXPORT_DATA' | 'DELETE_RECORD' | 'BLOCKCHAIN_VERIFY';
  user: string;
  userRole: string;
  resource: string;
  timestamp: Date;
  status: 'approved' | 'completed' | 'denied' | 'pending';
  approvedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  riskLevel: 'low' | 'medium' | 'high';
  blockchainTx?: string;
}

export const AuditLogs = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await mockDataService.getAuditLogs();
      if (response.success) {
        // Enhance mock data with additional fields
        const enhancedLogs: AuditLog[] = response.data.map((log: any, index: number) => ({
          ...log,
          userRole: ['admin', 'police', 'tourism', 'operator_112'][Math.floor(Math.random() * 4)],
          ipAddress: `192.168.1.${100 + index}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          blockchainTx: log.action === 'PII_ACCESS' ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined,
          details: getActionDetails(log.action, log.resource)
        }));

        // Add some recent logs for demo
        const additionalLogs: AuditLog[] = [
          {
            id: 'AUDIT-NEW-001',
            action: 'LOGIN',
            user: user?.name || 'Current User',
            userRole: user?.role || 'admin',
            resource: 'Authority Portal',
            timestamp: new Date(),
            status: 'completed',
            ipAddress: '192.168.1.105',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            riskLevel: 'low',
            details: 'Successful login to authority portal'
          },
          {
            id: 'AUDIT-NEW-002',
            action: 'ZONE_UPDATE',
            user: user?.name || 'Admin User',
            userRole: user?.role || 'admin',
            resource: 'Zone: Connaught Place',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            status: 'completed',
            ipAddress: '192.168.1.106',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            riskLevel: 'medium',
            details: 'Updated zone risk status from moderate to high'
          }
        ];

        setAuditLogs([...additionalLogs, ...enhancedLogs]);
      }
    } catch (error) {
      toast({
        title: "Error Loading Audit Logs",
        description: "Failed to load audit log data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = (action: string, resource: string): string => {
    switch (action) {
      case 'PII_ACCESS':
        return `Accessed personally identifiable information for ${resource}`;
      case 'INCIDENT_ASSIGN':
        return `Assigned incident ${resource} to responding officer`;
      case 'ZONE_UPDATE':
        return `Updated security zone configuration for ${resource}`;
      case 'LOGIN':
        return `User authenticated and logged into the system`;
      case 'EXPORT_DATA':
        return `Exported sensitive data: ${resource}`;
      case 'DELETE_RECORD':
        return `Deleted record: ${resource}`;
      case 'BLOCKCHAIN_VERIFY':
        return `Verified blockchain transaction for ${resource}`;
      default:
        return `Performed ${action} on ${resource}`;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'denied': return <XCircle className="h-4 w-4 text-danger" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'approved': return 'bg-success text-success-foreground';
      case 'denied': return 'bg-danger text-danger-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PII_ACCESS': return <Eye className="h-4 w-4" />;
      case 'INCIDENT_ASSIGN': return <FileText className="h-4 w-4" />;
      case 'ZONE_UPDATE': return <Shield className="h-4 w-4" />;
      case 'LOGIN': return <User className="h-4 w-4" />;
      case 'EXPORT_DATA': return <Download className="h-4 w-4" />;
      case 'DELETE_RECORD': return <XCircle className="h-4 w-4" />;
      case 'BLOCKCHAIN_VERIFY': return <Database className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleExportLogs = () => {
    // Create mock CSV export
    const csvData = filteredLogs.map(log => ({
      Timestamp: log.timestamp.toISOString(),
      Action: log.action,
      User: log.user,
      Role: log.userRole,
      Resource: log.resource,
      Status: log.status,
      'Risk Level': log.riskLevel,
      'IP Address': log.ipAddress,
      Details: log.details
    }));

    toast({
      title: "Export Started",
      description: `Exporting ${csvData.length} audit log entries to CSV format.`
    });

    // Log the export action
    const exportLog: AuditLog = {
      id: `AUDIT-EXPORT-${Date.now()}`,
      action: 'EXPORT_DATA',
      user: user?.name || 'Unknown User',
      userRole: user?.role || 'unknown',
      resource: `Audit Logs (${csvData.length} entries)`,
      timestamp: new Date(),
      status: 'completed',
      ipAddress: '192.168.1.107',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      riskLevel: 'medium',
      details: `Exported ${csvData.length} audit log entries to CSV format`
    };

    setAuditLogs(prev => [exportLog, ...prev]);
  };

  const handleAnchorToBlockchain = (logId: string) => {
    const log = auditLogs.find(l => l.id === logId);
    if (!log) return;

    // Mock blockchain anchoring
    const txId = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    setAuditLogs(prev => prev.map(l => 
      l.id === logId 
        ? { ...l, blockchainTx: txId, status: 'completed' as const }
        : l
    ));

    toast({
      title: "Blockchain Anchor Created",
      description: `Audit log anchored to blockchain: ${txId.substr(0, 10)}...`
    });
  };

  const canManageAudit = hasPermission(user, 'audit.manage') || user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Comprehensive audit trail of all system activities and access logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {canManageAudit && (
            <Button className="bg-gradient-primary text-white">
              <Database className="h-4 w-4 mr-2" />
              Blockchain Anchor
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by user, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="PII_ACCESS">PII Access</SelectItem>
                  <SelectItem value="INCIDENT_ASSIGN">Incident Assignment</SelectItem>
                  <SelectItem value="ZONE_UPDATE">Zone Updates</SelectItem>
                  <SelectItem value="LOGIN">System Login</SelectItem>
                  <SelectItem value="EXPORT_DATA">Data Export</SelectItem>
                  <SelectItem value="DELETE_RECORD">Record Deletion</SelectItem>
                  <SelectItem value="BLOCKCHAIN_VERIFY">Blockchain Verify</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.length}</div>
                <div className="text-sm text-muted-foreground">Total Logs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter(l => l.status === 'completed').length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter(l => l.status === 'pending').length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-info" />
              <div>
                <div className="text-2xl font-bold">{auditLogs.filter(l => l.blockchainTx).length}</div>
                <div className="text-sm text-muted-foreground">Blockchain Anchored</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Detailed audit trail showing all system activities and access attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No audit activities recorded yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-accent rounded-full">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{log.action.replace('_', ' ')}</h4>
                          <Badge className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                            <span className="ml-1">{log.status}</span>
                          </Badge>
                          <Badge variant="outline" className={getRiskColor(log.riskLevel)}>
                            {log.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">{log.user}</span> • {log.userRole} • {log.resource}
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(log.timestamp)}
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                          {log.blockchainTx && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {log.blockchainTx.substr(0, 10)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManageAudit && !log.blockchainTx && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAnchorToBlockchain(log.id)}
                        >
                          <Database className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                          toast({
                            title: "Copied to Clipboard",
                            description: "Audit log details copied to clipboard"
                          });
                        }}
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Log ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <p className="text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedLog.user} ({selectedLog.userRole})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Risk Level</Label>
                  <Badge variant="outline" className={getRiskColor(selectedLog.riskLevel)}>
                    {selectedLog.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedLog.ipAddress}</p>
                </div>
                {selectedLog.blockchainTx && (
                  <div>
                    <Label className="text-sm font-medium">Blockchain TX</Label>
                    <p className="text-sm text-muted-foreground font-mono break-all">{selectedLog.blockchainTx}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Resource</Label>
                <p className="text-sm text-muted-foreground">{selectedLog.resource}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Details</Label>
                <p className="text-sm text-muted-foreground">{selectedLog.details}</p>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-xs text-muted-foreground font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};