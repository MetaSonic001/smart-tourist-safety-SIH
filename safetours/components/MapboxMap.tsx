import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeatmapZone {
  id: string;
  polygon: number[][];
  riskLevel: 'low' | 'medium' | 'high';
  incidentCount: number;
  severity: number;
  lastUpdated: string;
  riskFactors: string[];
}

interface MapboxMapProps {
  zones: HeatmapZone[];
  onZoneClick?: (zone: HeatmapZone) => void;
  className?: string;
}

export const MapboxMap: React.FC<MapboxMapProps> = ({ zones, onZoneClick, className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token.trim()) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [77.2090, 28.6139], // Delhi, India coordinates
        zoom: 10,
        pitch: 0,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapInitialized(true);
        addHeatmapLayers();
      });

      setTokenError('');
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setTokenError('Invalid Mapbox token. Please check your token.');
    }
  };

  const addHeatmapLayers = () => {
    if (!map.current) return;

    zones.forEach((zone, index) => {
      // Create GeoJSON for each zone
      const geojson = {
        type: 'Feature' as const,
        properties: {
          id: zone.id,
          riskLevel: zone.riskLevel,
          incidentCount: zone.incidentCount,
          severity: zone.severity,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [zone.polygon.length > 0 ? zone.polygon : [
            // Default polygon if no coordinates
            [77.1 + (index % 3) * 0.1, 28.5 + Math.floor(index / 3) * 0.1],
            [77.2 + (index % 3) * 0.1, 28.5 + Math.floor(index / 3) * 0.1],
            [77.2 + (index % 3) * 0.1, 28.6 + Math.floor(index / 3) * 0.1],
            [77.1 + (index % 3) * 0.1, 28.6 + Math.floor(index / 3) * 0.1],
            [77.1 + (index % 3) * 0.1, 28.5 + Math.floor(index / 3) * 0.1],
          ]],
        },
      };

      const sourceId = `zone-${zone.id}`;
      const layerId = `zone-layer-${zone.id}`;

      // Add source
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });

      // Get color based on risk level
      const getColor = (riskLevel: string) => {
        switch (riskLevel) {
          case 'high': return '#dc2626';
          case 'medium': return '#ea580c';
          case 'low': return '#16a34a';
          default: return '#6b7280';
        }
      };

      // Add fill layer
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': getColor(zone.riskLevel),
          'fill-opacity': 0.6,
        },
      });

      // Add border layer
      map.current!.addLayer({
        id: `${layerId}-border`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': getColor(zone.riskLevel),
          'line-width': 2,
        },
      });

      // Add click listener
      map.current!.on('click', layerId, () => {
        onZoneClick?.(zone);
      });

      // Change cursor on hover
      map.current!.on('mouseenter', layerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current!.on('mouseleave', layerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Add popup
      map.current!.on('click', layerId, (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${zone.id}</h3>
              <p class="text-sm">Risk Level: ${zone.riskLevel}</p>
              <p class="text-sm">Incidents: ${zone.incidentCount}</p>
              <p class="text-sm">Severity: ${zone.severity.toFixed(2)}</p>
            </div>
          `)
          .addTo(map.current!);
      });
    });
  };

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      setTokenError('Please enter a valid Mapbox token');
      return;
    }
    initializeMap(mapboxToken);
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (mapInitialized && zones.length > 0) {
      // Clear existing layers
      zones.forEach((zone) => {
        const layerId = `zone-layer-${zone.id}`;
        if (map.current && map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
          map.current.removeLayer(`${layerId}-border`);
          map.current.removeSource(`zone-${zone.id}`);
        }
      });
      addHeatmapLayers();
    }
  }, [zones, mapInitialized]);

  if (!mapInitialized) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapbox Integration
          </CardTitle>
          <CardDescription>
            Enter your Mapbox public token to enable interactive maps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.ey..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className={tokenError ? 'border-destructive' : ''}
            />
            {tokenError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {tokenError}
              </div>
            )}
          </div>
          <Button onClick={handleTokenSubmit} className="w-full">
            Initialize Map
          </Button>
          <div className="text-xs text-muted-foreground">
            Get your free Mapbox token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {zones.length > 0 && (
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Risk Zones
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded"></div>
              <span>Low Risk ({zones.filter(z => z.riskLevel === 'low').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning rounded"></div>
              <span>Medium Risk ({zones.filter(z => z.riskLevel === 'medium').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emergency rounded"></div>
              <span>High Risk ({zones.filter(z => z.riskLevel === 'high').length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};