import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TriangleAlert as AlertTriangle, Clock, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export const RecentAlerts: React.FC = () => {
  const alerts = [
    {
      id: '1',
      type: 'zone_warning',
      title: 'Zone Alert',
      message: 'Entered moderate risk area - Laitumkhrah',
      timestamp: '2 hours ago',
      severity: 'warning',
    },
    {
      id: '2',
      type: 'safety_check',
      title: 'Safety Check',
      message: 'All systems normal - location verified',
      timestamp: '4 hours ago',
      severity: 'success',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      default:
        return Colors.info;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return MapPin;
      default:
        return Clock;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Alerts</Text>
      {alerts.map((alert) => {
        const SeverityIcon = getSeverityIcon(alert.severity);
        return (
          <View key={alert.id} style={styles.alertItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getSeverityColor(alert.severity) }
              ]}
            >
              <SeverityIcon size={16} color={Colors.white} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  alertTimestamp: {
    ...Typography.small,
    color: Colors.textLight,
  },
});