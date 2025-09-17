import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, TrendingUp, Clock, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { MapboxMap } from '@/components/MapboxMap';

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
        if (response.success && response.data) {
          // Convert the heatmap data to the expected format
          const heatmapZones: HeatmapZone[] = response.data.zones ? response.data.zones.map((zone: any) => ({
            id: zone.id || zone.name || `zone-${Math.random()}`,
            polygon: zone.coordinates || zone.polygon || [],
            riskLevel: zone.riskLevel || 'low',
            incidentCount: zone.incidentCount || 0,
            severity: zone.riskScore ? zone.riskScore / 10 : Math.random(),
            lastUpdated: new Date().toISOString(),
            riskFactors: ['Tourist activity', 'Crowd density', 'Security presence']
          })) : [];
          
          setZones(heatmapZones);
        } else {
          throw new Error(response.error || 'Failed to load heatmap data');
        }
      } catch (error) {
        console.error('Failed to load heatmap data:', error);
        toast({
          title: "Error",
          description: "Failed to load heatmap data",
          variant: "destructive",
        });
        setZones([]); // Set empty array as fallback
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
      title: "Zone Selected",
      description: `${zone.id} - Risk Level: ${zone.riskLevel}`,
    });
  };

  const handleDownloadData = () => {
    const csvData = zones.map(zone => ({
      'Zone ID': zone.id,
      'Risk Level': zone.riskLevel,
      'Incident Count': zone.incidentCount,
      'Severity Score': zone.severity,
      'Last Updated': zone.lastUpdated,
      'Risk Factors': zone.riskFactors.join('; ')
    }));
    
    toast({
      title: "Download Started",
      description: "Heatmap data CSV download initiated",
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading heatmap data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Risk Heatmap</h1>
          <p className="text-muted-foreground">Real-time risk assessment and zone monitoring</p>
        </div>
        <Button onClick={handleDownloadData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
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
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Severity Threshold:</span>
          <div className="w-32">
            <Slider
              value={severityThreshold}
              onValueChange={setSeverityThreshold}
              max={1}
              min={0}
              step={0.1}
            />
          </div>
          <span className="text-sm text-muted-foreground">{severityThreshold[0].toFixed(1)}</span>
        </div>
      </div>

      {/* Map Visualization and Zone Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Risk Heatmap Visualization
              </CardTitle>
              <CardDescription>
                Interactive map showing risk zones ({filteredZones.length} zones displayed)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {/* Mapbox Integration */}
                <MapboxMap
                  zones={filteredZones}
                  onZoneClick={handleZoneClick}
                  className="h-96 rounded-lg"
                />
                
                {/* Fallback Grid Map (shown when Mapbox is not initialized) */}
                <div className="h-96 bg-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden lg:hidden">
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
                    <p>Interactive Risk Heatmap</p>
                    <p className="text-sm">Click on zones to view details</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded"></div>
                  <span className="text-xs">Low Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded"></div>
                  <span className="text-xs">Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emergency rounded"></div>
                  <span className="text-xs">High Risk</span>
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
                  Zone Details
                  <Badge variant={getRiskBadgeVariant(selectedZone.riskLevel)}>
                    {selectedZone.riskLevel} risk
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Zone ID</div>
                  <div className="text-sm text-muted-foreground">{selectedZone.id}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Incident Count</div>
                  <div className="text-2xl font-bold text-primary">{selectedZone.incidentCount}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Severity Score</div>
                  <div className="text-lg font-semibold">{selectedZone.severity.toFixed(2)}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Risk Factors</div>
                  <div className="space-y-1">
                    {selectedZone.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last updated: {new Date(selectedZone.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Risk Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Risk Zones
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
                          {zone.incidentCount} incidents
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getRiskBadgeVariant(zone.riskLevel)} className="text-xs">
                          {zone.riskLevel}
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