import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert,
  Vibration 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TriangleAlert as AlertTriangle, MapPin, CreditCard, Navigation, Shield, Phone, User, Clock } from 'lucide-react-native';
import { SafetyGauge } from '@/components/SafetyGauge';
import { SOSButton } from '@/components/SOSButton';
import { QuickActionCard } from '@/components/QuickActionCard';
import { LocationDisplay } from '@/components/LocationDisplay';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [userName, setUserName] = useState('Rahul');
  const [safetyScore, setSafetyScore] = useState(87);
  const [locationData, setLocationData] = useState({
    area: 'Mall Road',
    zone: 'Tourist Zone',
    crowdLevel: 'Moderate',
    lastUpdated: new Date()
  });
  const [emergencyContacts] = useState([
    { name: 'Emergency Services', number: '112' },
    { name: 'Tourist Helpline', number: '1363' },
    { name: 'Local Police', number: '+91 177 2652970' }
  ]);

  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green - Safe
    if (score >= 60) return '#F59E0B'; // Yellow - Caution
    return '#EF4444'; // Red - Danger
  };

  const getSafetyLevel = (score: number) => {
    if (score >= 80) return 'Safe';
    if (score >= 60) return 'Caution';
    return 'High Risk';
  };

  const handleSOSPress = () => {
    Vibration.vibrate([0, 500, 200, 500]);
    Alert.alert(
      '🚨 Emergency SOS',
      'Are you sure you want to trigger emergency alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'YES - Send SOS', 
          style: 'destructive',
          onPress: () => {
            // Trigger SOS sequence
            Alert.alert('SOS Activated', 'Help is on the way!\n\nNotifying:\n• Emergency Services (112)\n• Tourist Helpline\n• Your emergency contacts');
          }
        }
      ]
    );
  };

  const quickActions = [
    {
      icon: MapPin,
      title: 'Navigation',
      subtitle: 'Safe routes',
      color: '#3B82F6',
      onPress: () => Alert.alert('Navigation', 'Opening safe route planner...')
    },
    {
      icon: CreditCard,
      title: 'Digital ID',
      subtitle: 'Show QR code',
      color: '#8B5CF6',
      onPress: () => Alert.alert('Digital ID', 'Opening your digital tourist ID...')
    },
    {
      icon: Navigation,
      title: 'Itinerary',
      subtitle: 'View plans',
      color: '#06B6D4',
      onPress: () => Alert.alert('Itinerary', 'Opening your travel itinerary...')
    },
    {
      icon: Phone,
      title: 'Emergency',
      subtitle: 'Quick contacts',
      color: '#EF4444',
      onPress: () => Alert.alert('Emergency Contacts', emergencyContacts.map(c => `${c.name}: ${c.number}`).join('\n'))
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Hello {userName} 👋</Text>
            <TouchableOpacity style={styles.digitalIdBadge}>
              <CreditCard size={16} color="#8B5CF6" />
              <Text style={styles.digitalIdText}>Digital ID</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <User size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Score Section */}
      <View style={styles.safetySection}>
        <View style={styles.safetyCard}>
          <SafetyGauge 
            score={safetyScore} 
            size={140}
            color={getSafetyColor(safetyScore)}
          />
          <View style={styles.safetyInfo}>
            <Text style={styles.safetyTitle}>Safety Score</Text>
            <Text style={[styles.safetyScore, { color: getSafetyColor(safetyScore) }]}>
              {safetyScore}% {getSafetyLevel(safetyScore)}
            </Text>
            <LocationDisplay locationData={locationData} />
          </View>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <SOSButton onPress={handleSOSPress} />
        <Text style={styles.sosHint}>Press and hold for 3 seconds</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              color={action.color}
              onPress={action.onPress}
            />
          ))}
        </View>
      </View>

      {/* Recent Alerts */}
      <View style={styles.recentAlertsSection}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.alertTitle}>Weather Advisory</Text>
            <Text style={styles.alertTime}>2h ago</Text>
          </View>
          <Text style={styles.alertMessage}>
            Heavy rainfall expected in Mall Road area. Consider indoor activities.
          </Text>
        </View>
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Shield size={20} color="#10B981" />
            <Text style={styles.alertTitle}>Safety Update</Text>
            <Text style={styles.alertTime}>4h ago</Text>
          </View>
          <Text style={styles.alertMessage}>
            Tourist police patrol increased in Ridge area. Safe for evening visits.
          </Text>
        </View>
      </View>
    </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  digitalIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  digitalIdText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  safetyInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  safetyScore: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sosSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  sosHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentAlertsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertMessage: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});