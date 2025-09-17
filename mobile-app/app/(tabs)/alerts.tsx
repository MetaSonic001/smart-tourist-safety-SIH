import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { TriangleAlert as AlertTriangle, Shield, MapPin, Clock, Navigation, Volume2, VolumeX, Bell, BellOff } from 'lucide-react-native';

export default function AlertsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const alerts = [
    {
      id: 1,
      type: 'danger',
      icon: AlertTriangle,
      title: 'High Risk Zone Alert',
      message: 'You are approaching a landslide-prone area. Immediate rerouting recommended.',
      time: '2 minutes ago',
      location: 'NH-5, Kullu District',
      color: '#EF4444',
      urgent: true,
      actions: [
        { label: 'Reroute Me', type: 'primary' },
        { label: 'Continue Anyway', type: 'secondary' }
      ]
    },
    {
      id: 2,
      type: 'warning',
      icon: Shield,
      title: 'Crowd Density Warning',
      message: 'High crowd density detected at Mall Road. Consider visiting during off-peak hours.',
      time: '15 minutes ago',
      location: 'Mall Road, Shimla',
      color: '#F59E0B',
      urgent: false,
      actions: [
        { label: 'Show Alternative', type: 'primary' },
        { label: 'Dismiss', type: 'secondary' }
      ]
    },
    {
      id: 3,
      type: 'info',
      icon: MapPin,
      title: 'Tourist Police Patrol',
      message: 'Enhanced security patrol active in your area. Safe for evening activities.',
      time: '1 hour ago',
      location: 'Ridge Area, Shimla',
      color: '#10B981',
      urgent: false,
      actions: [
        { label: 'View Details', type: 'primary' }
      ]
    },
    {
      id: 4,
      type: 'weather',
      icon: AlertTriangle,
      title: 'Weather Advisory',
      message: 'Heavy rainfall expected between 3-6 PM. Indoor activities recommended.',
      time: '2 hours ago',
      location: 'Shimla Region',
      color: '#3B82F6',
      urgent: false,
      actions: [
        { label: 'Indoor Suggestions', type: 'primary' },
        { label: 'Got it', type: 'secondary' }
      ]
    }
  ];

  const handleActionPress = (alertId: number, actionLabel: string) => {
    Alert.alert('Action Selected', `${actionLabel} for alert ${alertId}`);
  };

  const renderAlert = (alert: any) => (
    <View key={alert.id} style={[styles.alertCard, alert.urgent && styles.urgentAlert]}>
      {alert.urgent && <View style={styles.urgentBadge} />}
      
      <View style={styles.alertHeader}>
        <View style={[styles.alertIcon, { backgroundColor: alert.color + '20' }]}>
          <alert.icon size={20} color={alert.color} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <View style={styles.alertMeta}>
            <Clock size={12} color="#6B7280" />
            <Text style={styles.alertTime}>{alert.time}</Text>
            <Text style={styles.alertSeparator}>•</Text>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.alertLocation}>{alert.location}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.alertMessage}>{alert.message}</Text>

      <View style={styles.alertActions}>
        {alert.actions.map((action: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              action.type === 'primary' ? styles.primaryAction : styles.secondaryAction
            ]}
            onPress={() => handleActionPress(alert.id, action.label)}
          >
            <Text style={[
              styles.actionText,
              action.type === 'primary' ? styles.primaryActionText : styles.secondaryActionText
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety Alerts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? 
              <Volume2 size={20} color="#6B7280" /> : 
              <VolumeX size={20} color="#6B7280" />
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? 
              <Bell size={20} color="#6B7280" /> : 
              <BellOff size={20} color="#6B7280" />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EF444420' }]}>
              <AlertTriangle size={16} color="#EF4444" />
            </View>
            <Text style={styles.summaryCount}>1</Text>
            <Text style={styles.summaryLabel}>Urgent</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B20' }]}>
              <Shield size={16} color="#F59E0B" />
            </View>
            <Text style={styles.summaryCount}>1</Text>
            <Text style={styles.summaryLabel}>Warning</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98120' }]}>
              <MapPin size={16} color="#10B981" />
            </View>
            <Text style={styles.summaryCount}>2</Text>
            <Text style={styles.summaryLabel}>Info</Text>
          </View>
        </View>
      </View>

      {/* Alerts List */}
      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
        {alerts.map(renderAlert)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  urgentAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  urgentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    margin: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertSeparator: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertLocation: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
  },
  secondaryAction: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
  secondaryActionText: {
    color: '#6B7280',
  },
});