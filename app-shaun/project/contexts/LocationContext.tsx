import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Zone, NearbyPlace } from '@/types';
import { GeofenceService } from '@/services/GeofenceService';
import { MockDataService } from '@/services/MockDataService';
import { useAppContext } from './AppContext';

const LOCATION_TRACKING = 'location-tracking';

interface LocationContextType {
  currentLocation: Location.LocationObject | null;
  currentZone: Zone | null;
  zones: Zone[];
  nearbyPlaces: NearbyPlace[];
  isTrackingEnabled: boolean;
  setTrackingEnabled: (enabled: boolean) => void;
  locationPermission: Location.PermissionStatus;
  requestLocationPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Define the background task
TaskManager.defineTask(LOCATION_TRACKING, ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Received new locations', locations);
    // Handle background location updates
    GeofenceService.checkGeofences(locations[0]);
  }
});

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { useMockData } = useAppContext();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus>(
    Location.PermissionStatus.UNDETERMINED
  );

  useEffect(() => {
    initializeLocation();
    loadZones();
    loadNearbyPlaces();
  }, [useMockData]);

  const initializeLocation = async () => {
    // Check existing permissions
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);

    if (status === Location.PermissionStatus.GRANTED) {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (useMockData) {
        // Use mock location
        const mockLocation = MockDataService.getMockLocation();
        setCurrentLocation(mockLocation);
        checkCurrentZone(mockLocation);
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
        checkCurrentZone(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadZones = async () => {
    try {
      const zoneData = useMockData 
        ? MockDataService.getZones()
        : await GeofenceService.fetchZones();
      setZones(zoneData);
    } catch (error) {
      console.error('Error loading zones:', error);
      // Fallback to mock data
      setZones(MockDataService.getZones());
    }
  };

  const loadNearbyPlaces = async () => {
    try {
      const places = useMockData
        ? MockDataService.getNearbyPlaces()
        : []; // TODO: Implement API call
      setNearbyPlaces(places);
    } catch (error) {
      console.error('Error loading nearby places:', error);
      setNearbyPlaces(MockDataService.getNearbyPlaces());
    }
  };

  const checkCurrentZone = (location: Location.LocationObject) => {
    const zone = GeofenceService.findCurrentZone(location, zones);
    setCurrentZone(zone);
    
    if (zone && zone.riskLevel === 'high') {
      // Trigger local alert for high-risk zone
      GeofenceService.triggerZoneAlert(zone);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    
    if (status === Location.PermissionStatus.GRANTED) {
      getCurrentLocation();
      return true;
    }
    return false;
  };

  const handleSetTrackingEnabled = async (enabled: boolean) => {
    if (enabled) {
      // Request background permission
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
          accuracy: Location.Accuracy.High,
          timeInterval: 300000, // 5 minutes
          distanceInterval: 100, // 100 meters
          foregroundService: {
            notificationTitle: 'SafeTour is monitoring your location',
            notificationBody: 'For your safety and security',
          },
        });
        setIsTrackingEnabled(true);
      }
    } else {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      setIsTrackingEnabled(false);
    }
  };

  const value: LocationContextType = {
    currentLocation,
    currentZone,
    zones,
    nearbyPlaces,
    isTrackingEnabled,
    setTrackingEnabled: handleSetTrackingEnabled,
    locationPermission,
    requestLocationPermission,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};