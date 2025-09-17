import { useState } from 'react';
import { useApiFallback } from '@/hooks/useApiFallback';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { Search, QrCode, Shield, AlertTriangle, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: digitalIds, error, loading } = useApiFallback<DigitalId[]>('/api/digital-ids', '/mocks/digital-ids.json');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<DigitalId | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const filteredIds = (digitalIds || []).filter(id =>
    id.digitalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerifyId = async (digitalId: string) => {
    if (!hasPermission(user, 'digital_id.verify')) {
      toast({
        title: t('Access Denied'),
        description: t("You don't have permission to verify digital IDs"),
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: t('Verification Complete'),
        description: t(`Digital ID ${digitalId} verified on blockchain`),
      });
    } catch (error) {
      toast({
        title: t('Verification Failed'),
        description: t('Failed to verify digital ID on blockchain'),
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQrScan = () => {
    setShowQrScanner(true);
    setTimeout(() => {
      if (!digitalIds || digitalIds.length === 0) {
        toast({
          title: t('QR Scan Failed'),
          description: t('No digital IDs available.'),
          variant: 'destructive',
        });
        setShowQrScanner(false);
        return;
      }
      const randomId = digitalIds[Math.floor(Math.random() * digitalIds.length)];
      setSearchTerm(randomId.digitalId);
      setSelectedId(randomId);
      setShowQrScanner(false);
      toast({
        title: t('QR Code Scanned'),
        description: t(`Found Digital ID: ${randomId.digitalId}`),
      });
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-emergency" />;
      default: return <Shield className="h-4 w-4" />;
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
          <p className="text-muted-foreground">{t('Loading digital IDs...')}</p>
        </div>
      </div>
    );
  }
}
