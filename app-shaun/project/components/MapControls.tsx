import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { RotateCcw, Navigation, Layers } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export const MapControls: React.FC = () => {
  const handleRecenter = () => {
    // Implement map recenter
  };

  const handleNavigation = () => {
    // Implement navigation
  };

  const handleLayers = () => {
    // Implement layer toggle
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.controlButton} onPress={handleRecenter}>
        <RotateCcw size={24} color={Colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={handleNavigation}>
        <Navigation size={24} color={Colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={handleLayers}>
        <Layers size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});