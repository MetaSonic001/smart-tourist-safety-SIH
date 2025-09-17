import { useState, useEffect } from 'react';
import { useApiFallback } from '@/hooks/useApiFallback';
import { offlineQueue } from '@/services/offlineQueue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';

interface Zone {
  id: string;
  name: string;
  type: string;
  status: string;
  riskLevel: string;
  polygon: number[][];
  description: string;
  population: number;
  averageVisitors: number;
  lastUpdated: string;
  managedBy: string;
  emergencyContact: string;
  facilities: string[];
  restrictions: string[];
}

export const Zones = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState<Partial<Zone>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data, error, loading: apiLoading } = useApiFallback<Zone[]>('/api/zones', '/mocks/zones.json');
  useEffect(() => {
    if (data) setZones(data);
    setLoading(apiLoading);
    if (error) {
      toast({
        title: t('Error'),
        description: t('Failed to load zones data.'),
        variant: 'destructive',
      });
    }
  }, [data, error, apiLoading, t, toast]);

  const handleStatusUpdate = (zoneId: string, status: string) => {
    setZones(zones => zones.map(z => z.id === zoneId ? { ...z, status } : z));
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'UPDATE_ZONE_STATUS', payload: { zoneId, status } });
    } else {
      // TODO: POST to API if online
    }
    toast({
      title: t('Status Updated'),
      description: t(`Zone status updated to ${status}`),
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones => zones.filter(z => z.id !== zoneId));
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'DELETE_ZONE', payload: { zoneId } });
    } else {
      // TODO: DELETE from API if online
    }
    toast({
      title: t('Zone Deleted'),
      description: t('Zone removed from the list.'),
      variant: 'destructive',
    });
  };

  const handleAddZone = () => {
    if (!newZone.name || !newZone.id) {
      toast({
        title: t('Missing Data'),
        description: t('Zone name and ID are required.'),
        variant: 'destructive',
      });
      return;
    }
    setZones(zones => [...zones, { ...newZone, polygon: [], facilities: [], restrictions: [], type: 'custom', status: 'active', riskLevel: 'low', description: '', population: 0, averageVisitors: 0, lastUpdated: new Date().toISOString(), managedBy: '', emergencyContact: '' } as Zone]);
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'ADD_ZONE', payload: { ...newZone } });
    } else {
      // TODO: POST to API if online
    }
    setShowAddDialog(false);
    setNewZone({});
    toast({
      title: t('Zone Added'),
      description: t('New zone added.'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" aria-busy="true" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-label={t('Loading')} />
          <p className="text-muted-foreground">{t('Loading zones...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Zone Management')}</h1>
        <Button onClick={() => setShowAddDialog(true)}>{t('Add Zone')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <Card key={zone.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{zone.name}</span>
                <Badge variant={zone.riskLevel === 'high' ? 'destructive' : zone.riskLevel === 'medium' ? 'secondary' : 'outline'}>{t(zone.riskLevel)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">{zone.description}</div>
              <div className="flex gap-2 text-xs">
                <span>{t('Status')}: <b>{zone.status}</b></span>
                <span>{t('Type')}: {zone.type}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span>{t('Population')}: {zone.population}</span>
                <span>{t('Visitors')}: {zone.averageVisitors}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span>{t('Managed By')}: {zone.managedBy}</span>
                <span>{t('Emergency')}: {zone.emergencyContact}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span>{t('Facilities')}: {zone.facilities?.join(', ')}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span>{t('Restrictions')}: {zone.restrictions?.join(', ')}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedZone(zone)}>{t('View')}</Button>
                <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(zone.id, zone.status === 'active' ? 'monitoring' : 'active')}>{t('Toggle Status')}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteZone(zone.id)}>{t('Delete')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zone Details Dialog */}
      <Dialog open={!!selectedZone} onOpenChange={() => setSelectedZone(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Zone Details')}</DialogTitle>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-2">
              <div className="font-bold text-lg">{selectedZone.name}</div>
              <div>{selectedZone.description}</div>
              <div className="text-xs">{t('Polygon')}: {JSON.stringify(selectedZone.polygon)}</div>
              <div className="text-xs">{t('Facilities')}: {selectedZone.facilities?.join(', ')}</div>
              <div className="text-xs">{t('Restrictions')}: {selectedZone.restrictions?.join(', ')}</div>
              <div className="text-xs">{t('Last Updated')}: {new Date(selectedZone.lastUpdated).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Zone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Add New Zone')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder={t('Zone ID')} value={newZone.id || ''} onChange={e => setNewZone(z => ({ ...z, id: e.target.value }))} />
            <Input placeholder={t('Zone Name')} value={newZone.name || ''} onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))} />
            <Input placeholder={t('Description')} value={newZone.description || ''} onChange={e => setNewZone(z => ({ ...z, description: e.target.value }))} />
            <Button onClick={handleAddZone}>{t('Add')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Zones;
