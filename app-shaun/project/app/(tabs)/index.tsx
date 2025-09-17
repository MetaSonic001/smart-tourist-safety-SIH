import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, TriangleAlert as AlertTriangle, Phone, MapPin, Activity } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppContext } from '@/contexts/AppContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { SOSButton } from '@/components/SOSButton';
import { SafetyScoreCard } from '@/components/SafetyScoreCard';
import { DigitalIDCard } from '@/components/DigitalIDCard';
import { QuickActions } from '@/components/QuickActions';
import { RecentAlerts } from '@/components/RecentAlerts';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, safetyScore, isOnline } = useAppContext();
  const { currentZone } = useLocationContext();

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'Call 112 for immediate emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {/* Implement emergency call */} }
      ]
    );
  };

  if (!user) {
    router.replace('/welcome');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            <View style={styles.connectionStatus}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: isOnline ? Colors.success : Colors.warning }
              ]} />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Safety Score */}
        <SafetyScoreCard score={safetyScore} />

        {/* Digital ID Card */}
        <DigitalIDCard digitalId={user.digitalId} />

        {/* Current Zone Status */}
        {currentZone && (
          <View style={styles.zoneCard}>
            <View style={styles.zoneHeader}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.zoneTitle}>Current Zone</Text>
            </View>
            <Text style={styles.zoneName}>{currentZone.name}</Text>
            <View style={[
              styles.riskBadge,
              { backgroundColor: currentZone.riskLevel === 'high' ? Colors.error : 
                                currentZone.riskLevel === 'medium' ? Colors.warning : Colors.success }
            ]}>
              <Text style={styles.riskText}>
                {currentZone.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>
        )}

        {/* SOS Button */}
        <SOSButton onPress={() => router.push('/sos')} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Alerts */}
        <RecentAlerts />

        {/* Emergency Call Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Phone size={24} color={Colors.white} />
          <Text style={styles.emergencyText}>Emergency Call 112</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...Typography.body,
    color: Colors.white,
    opacity: 0.9,
  },
  userName: {
    ...Typography.h2,
    color: Colors.white,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.white,
  },
  zoneCard: {
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
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneTitle: {
    ...Typography.body,
    marginLeft: 8,
    color: Colors.textSecondary,
  },
  zoneName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 8,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
  },
  emergencyText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});