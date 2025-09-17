import { useState, useEffect } from 'react';
import { useApiFallback } from '@/hooks/useApiFallback';
import { offlineQueue } from '@/services/offlineQueue';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  success: boolean;
  severity: string;
  category: string;
}

export const Audit = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showPiiDialog, setShowPiiDialog] = useState(false);

  const { data, error, loading: apiLoading } = useApiFallback<AuditLog[]>('/api/audit-logs', '/mocks/audit-logs.json');
  useEffect(() => {
    if (data) setLogs(data);
    setLoading(apiLoading);
    if (error) {
      toast({
        title: t('Error'),
        description: t('Failed to load audit logs.'),
        variant: 'destructive',
      });
    }
  }, [data, error, apiLoading, t, toast]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || log.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleRequestPii = () => {
    setShowPiiDialog(false);
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'PII_REQUEST', payload: { timestamp: Date.now() } });
    } else {
      // TODO: POST to API if online
    }
    toast({
      title: t('PII Access Requested'),
      description: t('PII access request submitted for admin approval.'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" aria-busy="true" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-label={t('Loading')} />
          <p className="text-muted-foreground">{t('Loading audit logs...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Audit Logs')}</h1>
        <div className="flex gap-2">
          <Input placeholder={t('Search logs...')} value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="all">{t('All')}</option>
            <option value="data_access">{t('Data Access')}</option>
            <option value="user_management">{t('User Management')}</option>
            <option value="incident_management">{t('Incident Management')}</option>
            <option value="verification">{t('Verification')}</option>
            <option value="zone_management">{t('Zone Management')}</option>
            <option value="emergency_response">{t('Emergency Response')}</option>
            <option value="blockchain">{t('Blockchain')}</option>
          </select>
          <Button variant="outline" onClick={() => setShowPiiDialog(true)}>{t('Request PII Access')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogs.map(log => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{log.action}</span>
                <Badge variant={log.success ? 'default' : 'destructive'}>{log.success ? t('Success') : t('Failed')}</Badge>
              </CardTitle>
              <CardDescription>{log.userName} • {new Date(log.timestamp).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">{log.details}</div>
              <div className="flex gap-2 text-xs">
                <span>{t('Resource')}: {log.resource}</span>
                <span>{t('Category')}: {log.category}</span>
                <span>{t('Severity')}: {log.severity}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>{t('View')}</Button>
                {log.action === 'BLOCKCHAIN_ANCHOR' && (
                  <Badge variant="secondary">{t('Anchored to Blockchain')}</Badge>
                )}
                {log.action === 'PII_ACCESS_REQUEST' && !log.success && (
                  <Badge variant="destructive">{t('Pending Approval')}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Audit Log Details')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2">
              <div className="font-bold text-lg">{selectedLog.action}</div>
              <div>{selectedLog.details}</div>
              <div className="text-xs">{t('User')}: {selectedLog.userName}</div>
              <div className="text-xs">{t('Resource')}: {selectedLog.resource}</div>
              <div className="text-xs">{t('Timestamp')}: {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div className="text-xs">{t('IP Address')}: {selectedLog.ipAddress}</div>
              <div className="text-xs">{t('Severity')}: {selectedLog.severity}</div>
              <div className="text-xs">{t('Category')}: {selectedLog.category}</div>
              {selectedLog.action === 'BLOCKCHAIN_ANCHOR' && (
                <div className="text-xs font-mono mt-2">{t('Blockchain TX')}: {selectedLog.details.split('TX:')[1]?.trim() || t('N/A')}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PII Access Request Dialog */}
      <Dialog open={showPiiDialog} onOpenChange={setShowPiiDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Request PII Access')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>{t('Request access to PII data for incident investigation. This will require admin approval.')}</p>
            <Button onClick={handleRequestPii}>{t('Submit Request')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Audit;
