import { useState, useEffect } from 'react';
import { Search, QrCode, Shield, AlertTriangle, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { useAuth, hasPermission } from '@/contexts/AuthContext';

interface DigitalId {
  digitalId: string;
  status: 'verified' | 'pending' | 'flagged';
  issueDate: string;
  expiryDate: string;
  nationality: string;
  visaType: string;
  lastSeen: string;
  location: string;
  verificationCount: number;
  blockchainTx: string;
  consentScope: string[];
  flagReason?: string;
  pendingReason?: string;
  itinerary?: Array<{ location: string; date: string }>;
}

export const DigitalIds = () => {
  const { user } = useAuth();
  const [digitalIds, setDigitalIds] = useState<DigitalId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<DigitalId | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    const loadDigitalIds = async () => {
      setLoading(true);
      try {
        const data = await mockDataService.getDigitalIds();
        setDigitalIds(data);
      } catch (error) {
        console.error('Failed to load digital IDs:', error);
        toast({
          title: "Error",
          description: "Failed to load digital IDs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDigitalIds();
  }, []);

  const filteredIds = digitalIds.filter(id =>
    id.digitalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerifyId = async (digitalId: string) => {
    if (!hasPermission(user, 'digital_id.verify')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to verify digital IDs",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate blockchain verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Verification Complete",
        description: `Digital ID ${digitalId} verified on blockchain`,
      });

      // Update verification count
      setDigitalIds(prev => prev.map(id => 
        id.digitalId === digitalId 
          ? { ...id, verificationCount: id.verificationCount + 1 }
          : id
      ));
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify digital ID on blockchain",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQrScan = () => {
    setShowQrScanner(true);
    // Simulate QR scan result
    setTimeout(() => {
      const randomId = digitalIds[Math.floor(Math.random() * digitalIds.length)];
      setSearchTerm(randomId.digitalId);
      setSelectedId(randomId);
      setShowQrScanner(false);
      toast({
        title: "QR Code Scanned",
        description: `Found Digital ID: ${randomId.digitalId}`,
      });
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-emergency" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default' as const;
      case 'pending': return 'secondary' as const;
      case 'flagged': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading digital IDs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Digital ID Verification</h1>
          <p className="text-muted-foreground">Blockchain-backed tourist identification system</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleQrScan} className="gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </Button>
          <Button className="gap-2">
            <Shield className="h-4 w-4" />
            Bulk Verify
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Digital ID, nationality, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Verified IDs</p>
                <p className="text-2xl font-bold">
                  {digitalIds.filter(id => id.status === 'verified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {digitalIds.filter(id => id.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-emergency" />
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold">
                  {digitalIds.filter(id => id.status === 'flagged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total IDs</p>
                <p className="text-2xl font-bold">{digitalIds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Digital IDs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIds.map((digitalId) => (
          <Card key={digitalId.digitalId} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{digitalId.digitalId}</CardTitle>
                  <CardDescription>{digitalId.nationality} • {digitalId.visaType}</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(digitalId.status)} className="gap-1">
                  {getStatusIcon(digitalId.status)}
                  {digitalId.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Seen:</span>
                  <div className="font-medium">{digitalId.location}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(digitalId.lastSeen).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Verifications:</span>
                  <div className="font-medium">{digitalId.verificationCount}</div>
                </div>
              </div>

              {digitalId.flagReason && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                  <div className="font-medium text-destructive">Flag Reason:</div>
                  <div>{digitalId.flagReason}</div>
                </div>
              )}

              {digitalId.pendingReason && (
                <div className="p-2 bg-warning/10 border border-warning/20 rounded text-sm">
                  <div className="font-medium text-warning">Pending Reason:</div>
                  <div>{digitalId.pendingReason}</div>
                </div>
              )}

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="h-3 w-3" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Digital ID Details: {digitalId.digitalId}</DialogTitle>
                      <DialogDescription>
                        Complete information and verification status
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(digitalId.status)}
                            <span className="capitalize">{digitalId.status}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Blockchain TX</label>
                          <div className="text-sm font-mono mt-1">{digitalId.blockchainTx}</div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Consent Scope</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {digitalId.consentScope.map((scope, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {scope.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {digitalId.itinerary && (
                        <div>
                          <label className="text-sm font-medium">Planned Itinerary</label>
                          <div className="mt-2 space-y-2">
                            {digitalId.itinerary.map((item, index) => (
                              <div key={index} className="flex justify-between p-2 bg-muted/50 rounded">
                                <span>{item.location}</span>
                                <span className="text-sm text-muted-foreground">{item.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleVerifyId(digitalId.digitalId)}
                          disabled={isVerifying}
                          className="gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          {isVerifying ? 'Verifying...' : 'Verify on Blockchain'}
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  onClick={() => handleVerifyId(digitalId.digitalId)}
                  disabled={isVerifying}
                  className="gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Scanner Modal */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code Scanner</DialogTitle>
            <DialogDescription>
              Position the QR code within the scanner area
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">Scanning for QR codes...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};