import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Users, Clock } from 'lucide-react-native';

interface LocationData {
  area: string;
  zone: string;
  crowdLevel: string;
  lastUpdated: Date;
}

interface LocationDisplayProps {
  locationData: LocationData;
}

export function LocationDisplay({ locationData }: LocationDisplayProps) {
  const getCrowdColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationInfo}>
        <MapPin size={14} color="#6B7280" />
        <Text style={styles.locationText}>{locationData.area}</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.zoneText}>{locationData.zone}</Text>
      </View>
      
      <View style={styles.crowdInfo}>
        <Users size={14} color={getCrowdColor(locationData.crowdLevel)} />
        <Text style={[styles.crowdText, { color: getCrowdColor(locationData.crowdLevel) }]}>
          {locationData.crowdLevel} Crowd
        </Text>
      </View>
      
      <View style={styles.updateInfo}>
        <Clock size={12} color="#9CA3AF" />
        <Text style={styles.updateText}>Updated {formatTime(locationData.lastUpdated)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  separator: {
    fontSize: 12,
    color: '#6B7280',
  },
  zoneText: {
    fontSize: 12,
    color: '#6B7280',
  },
  crowdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crowdText: {
    fontSize: 12,
    fontWeight: '500',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});