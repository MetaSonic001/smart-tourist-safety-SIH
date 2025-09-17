import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Download, Layers, Navigation, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useLocationContext } from '@/contexts/LocationContext';
import { useAppContext } from '@/contexts/AppContext';
import { MapControls } from '@/components/MapControls';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { RouteOptimizer } from '@/components/RouteOptimizer';

export default function MapScreen() {
  const { currentLocation, zones, nearbyPlaces } = useLocationContext();
  const { isOnline } = useAppContext();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [showNearby, setShowNearby] = useState(true);

  const handleDownloadOfflineMap = () => {
    Alert.alert(
      'Download Offline Map',
      'Download map data for this region for offline use?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: downloadMapData }
      ]
    );
  };

  const downloadMapData = async () => {
    // Implementation for offline map download
    Alert.alert('Success', 'Map data downloaded for offline use');
  };

  const getPolygonColor = (zone: any) => {
    switch (zone.riskLevel) {
      case 'high':
        return 'rgba(255, 0, 0, 0.3)';
      case 'medium':
        return 'rgba(255, 165, 0, 0.3)';
      default:
        return 'rgba(0, 255, 0, 0.3)';
    }
  };

  const getPolygonStrokeColor = (zone: any) => {
    switch (zone.riskLevel) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      default:
        return Colors.success;
    }
  };

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety Map</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, !isOnline && styles.disabledButton]}
            onPress={handleDownloadOfflineMap}
            disabled={!isOnline}
          >
            <Download size={20} color={isOnline ? Colors.primary : Colors.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
          >
            <Layers size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType={mapType}
        initialRegion={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* Geofence Polygons */}
        {zones.map((zone, index) => (
          <Polygon
            key={index}
            coordinates={zone.coordinates}
            fillColor={getPolygonColor(zone)}
            strokeColor={getPolygonStrokeColor(zone)}
            strokeWidth={2}
          />
        ))}

        {/* Nearby Places */}
        {showNearby && nearbyPlaces.map((place, index) => (
          <Marker
            key={index}
            coordinate={place.coordinate}
            title={place.name}
            description={place.type}
            pinColor={place.type === 'police' ? Colors.primary : 
                     place.type === 'hospital' ? Colors.error : Colors.warning}
          />
        ))}
      </MapView>

      {/* Map Controls */}
      <MapControls />

      {/* Risk Zone Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Risk Zones</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Safe</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.error }]} />
          <Text style={styles.legendText}>High Risk</Text>
        </View>
      </View>

      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendTitle: {
    ...Typography.caption,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 70,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  offlineText: {
    ...Typography.caption,
    color: Colors.warning,
    marginLeft: 4,
  },
});