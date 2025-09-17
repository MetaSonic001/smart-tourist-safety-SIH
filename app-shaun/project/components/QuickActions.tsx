import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Phone, Users, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      icon: MapPin,
      label: 'Check In',
      onPress: () => {/* Implement check-in */},
      color: Colors.primary,
    },
    {
      icon: Phone,
      label: 'Call Help',
      onPress: () => {/* Implement help call */},
      color: Colors.success,
    },
    {
      icon: Users,
      label: 'Share Location',
      onPress: () => router.push('/(tabs)/tracking'),
      color: Colors.warning,
    },
    {
      icon: MessageCircle,
      label: 'Report',
      onPress: () => {/* Implement reporting */},
      color: Colors.info,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { borderColor: action.color }]}
            onPress={action.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
              <action.icon size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});