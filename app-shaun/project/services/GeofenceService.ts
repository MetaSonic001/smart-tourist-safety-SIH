import { Zone } from '@/types';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

class GeofenceService {
  async fetchZones(): Promise<Zone[]> {
    // This would normally fetch from the Dashboard API
    // For now, return empty array as fallback will use mock data
    return [];
  }

  findCurrentZone(location: Location.LocationObject, zones: Zone[]): Zone | null {
    const point = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    for (const zone of zones) {
      if (this.isPointInPolygon(point, zone.coordinates)) {
        return zone;
      }
    }

    return null;
  }

  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: { latitude: number; longitude: number }[]
  ): boolean {
    const x = point.latitude;
    const y = point.longitude;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  async checkGeofences(location: Location.LocationObject) {
    // This would be called from background task
    console.log('Checking geofences for location:', location);
    // Implementation for background geofence checking
  }

  async triggerZoneAlert(zone: Zone) {
    // Show local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Safety Alert',
        body: `You've entered ${zone.name} - ${zone.riskLevel.toUpperCase()} risk area`,
        data: { zoneId: zone.id, riskLevel: zone.riskLevel },
        sound: true,
      },
      trigger: null,
    });

    // Show alert dialog
    Alert.alert(
      'Safety Alert',
      `You've entered ${zone.name}, a ${zone.riskLevel} risk area.\n\n${zone.description || ''}${
        zone.alerts ? '\n\nAlerts:\n• ' + zone.alerts.join('\n• ') : ''
      }`,
      [
        { text: 'OK', style: 'default' },
        { text: 'View on Map', onPress: () => {/* Navigate to map */} },
      ]
    );
  }
}

export const GeofenceService = new GeofenceService();