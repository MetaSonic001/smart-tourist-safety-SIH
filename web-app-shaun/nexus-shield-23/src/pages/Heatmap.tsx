import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { MapPin, AlertTriangle, TrendingUp, Clock, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';

interface HeatmapZone {
  id: string;
  polygon: number[][];
  riskLevel: 'low' | 'medium' | 'high';
  incidentCount: number;
  severity: number;
  lastUpdated: string;
  riskFactors: string[];
}

export const Heatmap = () => {
  const { t } = useI18n();
  const [zones, setZones] = useState<HeatmapZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24h');
  const [severityThreshold, setSeverityThreshold] = useState([0.3]);
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null);

  useEffect(() => {
    const loadHeatmapData = async () => {
      setLoading(true);
      try {
        const response = await mockDataService.getHeatmapData();
        // Transform mock zones to HeatmapZone format
        const rawZones = response.data?.zones ?? [];
        const zonesTransformed = rawZones.map((zone: any) => ({
          id: zone.id,
          polygon: zone.coordinates || zone.polygon || [],
          riskLevel: zone.riskLevel || (zone.status === 'unsafe' ? 'high' : zone.status === 'moderate' ? 'medium' : 'low'),
          incidentCount: zone.incidentCount || zone.riskScore || 0,
          severity: typeof zone.riskScore === 'number' ? Math.min(Math.max(zone.riskScore / 10, 0), 1) : (zone.incidentCount ? Math.min(zone.incidentCount / 20, 1) : 0.3),
          lastUpdated: zone.lastUpdate ? new Date(zone.lastUpdate).toISOString() : new Date().toISOString(),
          riskFactors: zone.riskLevel ? [zone.riskLevel] : (zone.status ? [zone.status] : []),
        }));
        setZones(zonesTransformed);
      } catch (error) {
        console.error('Failed to load heatmap data:', error);
        toast({
          title: "Error",
          description: "Failed to load heatmap data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHeatmapData();
  }, [timeWindow]);

  const filteredZones = zones.filter(zone => zone.severity >= severityThreshold[0]);

  const handleZoneClick = (zone: HeatmapZone) => {
    setSelectedZone(zone);
    toast({
  title: t('Zone Selected'),
  description: t(`Zone ${zone.id} - Risk Level: ${zone.riskLevel}`),
    });
  };

  const handleDownloadData = () => {
    const csvRows = [
      ['Zone ID', 'Risk Level', 'Incident Count', 'Severity Score', 'Last Updated', 'Risk Factors'],
      ...zones.map(zone => [
        zone.id,
        zone.riskLevel,
        zone.incidentCount,
        zone.severity,
        zone.lastUpdated,
        zone.riskFactors.join('; ')
      ])
    ];
    const csvContent = csvRows.map(row => row.map(String).map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heatmap_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: t('Download Started'),
      description: t('Heatmap data CSV download initiated'),
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-emergency/20 border-emergency text-emergency-foreground';
      case 'medium': return 'bg-warning/20 border-warning text-warning-foreground';
      case 'low': return 'bg-success/20 border-success text-success-foreground';
      default: return 'bg-muted';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" aria-busy="true" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-label={t('Loading')} />
          <p className="text-muted-foreground">{t('Loading heatmap data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Risk Heatmap')}</h1>
          <p className="text-muted-foreground">{t('Real-time risk assessment and zone monitoring')}</p>
        </div>
        <Button onClick={handleDownloadData} className="gap-2" aria-label={t('Export Data')}>
          <Download className="h-4 w-4" />
          {t('Export Data')}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4" />
          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t('Last Hour')}</SelectItem>
              <SelectItem value="24h">{t('Last 24h')}</SelectItem>
              <SelectItem value="7d">{t('Last 7 days')}</SelectItem>
              <SelectItem value="30d">{t('Last 30 days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t('Severity Threshold')}:</span>
          <div className="w-32">
            <Slider
              value={severityThreshold}
              onValueChange={setSeverityThreshold}
              max={1}
              min={0}
              step={0.1}
              aria-label={t('Severity Threshold')}
            />
          </div>
          <span className="text-sm text-muted-foreground">{severityThreshold[0].toFixed(1)}</span>
        </div>
      </div>

      {/* Map Placeholder and Zone Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('Risk Heatmap Visualization')}
              </CardTitle>
              <CardDescription>
                {t(`Interactive map showing risk zones (${filteredZones.length} zones displayed)`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Simulated Map Grid */}
                <div className="absolute inset-4 grid grid-cols-4 gap-2">
                  {filteredZones.slice(0, 16).map((zone, index) => (
                    <div
                      key={zone.id}
                      className={`rounded cursor-pointer transition-all hover:scale-105 border-2 ${getRiskColor(zone.riskLevel)}`}
                      onClick={() => handleZoneClick(zone)}
                      title={`${zone.id} - ${zone.riskLevel} risk`}
                    >
                      <div className="p-2 text-center">
                        <div className="text-xs font-medium">{zone.incidentCount}</div>
                        <div className="text-xs opacity-75">incidents</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('Interactive Risk Heatmap')}</p>
                  <p className="text-sm">{t('Click on zones to view details')}</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4" aria-label={t('Risk Legend')}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded" />
                  <span className="text-xs">{t('Low Risk')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded" />
                  <span className="text-xs">{t('Medium Risk')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emergency rounded" />
                  <span className="text-xs">{t('High Risk')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone Details */}
        <div className="space-y-4">
          {selectedZone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t('Zone Details')}
                  <Badge variant={getRiskBadgeVariant(selectedZone.riskLevel)}>
                    {t(`${selectedZone.riskLevel} risk`)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">{t('Zone ID')}</div>
                  <div className="text-sm text-muted-foreground">{selectedZone.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t('Incident Count')}</div>
                  <div className="text-2xl font-bold text-primary">{selectedZone.incidentCount}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t('Severity Score')}</div>
                  <div className="text-lg font-semibold">{selectedZone.severity.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t('Risk Factors')}</div>
                  <div className="space-y-1">
                    {selectedZone.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {t(factor)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t('Last updated')}: {new Date(selectedZone.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Risk Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('Top Risk Zones')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zones
                  .sort((a, b) => b.severity - a.severity)
                  .slice(0, 5)
                  .map((zone, index) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => handleZoneClick(zone)}
                    >
                      <div>
                        <div className="font-medium text-sm">{zone.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {zone.incidentCount} {t('incidents')}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getRiskBadgeVariant(zone.riskLevel)} className="text-xs">
                          {t(zone.riskLevel)}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {zone.severity.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};