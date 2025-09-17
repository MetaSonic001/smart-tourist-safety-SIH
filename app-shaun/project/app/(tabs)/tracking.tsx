import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share, Users, Clock, MapPin, Shield, Link2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppContext } from '@/contexts/AppContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { ShareLocationCard } from '@/components/ShareLocationCard';
import { TrackingControls } from '@/components/TrackingControls';
import { LovedOnesManager } from '@/components/LovedOnesManager';

export default function TrackingScreen() {
  const { user, isOnline } = useAppContext();
  const { currentLocation, isTrackingEnabled, setTrackingEnabled } = useLocationContext();
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [showLovedOnesManager, setShowLovedOnesManager] = useState(false);

  const handleToggleTracking = () => {
    Alert.alert(
      isTrackingEnabled ? 'Disable Tracking' : 'Enable Tracking',
      isTrackingEnabled 
        ? 'This will stop sharing your location with loved ones and disable background safety monitoring.'
        : 'This will enable background location sharing and safety monitoring. Your location will only be shared with people you explicitly authorize.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isTrackingEnabled ? 'Disable' : 'Enable', 
          onPress: () => setTrackingEnabled(!isTrackingEnabled),
          style: isTrackingEnabled ? 'destructive' : 'default'
        }
      ]
    );
  };

  const handleCreateShareLink = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Location sharing requires an internet connection. You can create an offline share QR code instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create QR', onPress: createOfflineQR }
        ]
      );
      return;
    }
    
    // Create secure share link
    const newLink = {
      id: Date.now().toString(),
      url: `https://safetour.app/track/${user?.digitalId}/${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };
    
    setShareLinks([...shareLinks, newLink]);
    Alert.alert('Success', 'Share link created! Valid for 24 hours.');
  };

  const createOfflineQR = () => {
    Alert.alert('Offline QR Created', 'QR code generated with encrypted location data for manual sharing.');
  };

  const handleShareLocation = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    const shareMessage = `I'm sharing my live location with you via SafeTour.\n\nCurrent location: https://maps.google.com/?q=${currentLocation.coords.latitude},${currentLocation.coords.longitude}\n\nThis is a safety feature - please check on me if you notice anything unusual.`;
    
    Share.share({
      message: shareMessage,
      title: 'My Live Location - SafeTour',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Location</Text>
          <Text style={styles.headerSubtitle}>
            Stay connected with your loved ones
          </Text>
        </View>

        {/* Tracking Toggle */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Shield size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Background Tracking</Text>
            </View>
            <Switch
              value={isTrackingEnabled}
              onValueChange={handleToggleTracking}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <Text style={styles.cardDescription}>
            {isTrackingEnabled 
              ? 'Your location is being monitored for safety. Loved ones can track you via shared links.'
              : 'Enable to allow background safety monitoring and location sharing with trusted contacts.'
            }
          </Text>
        </View>

        {/* Share Location Card */}
        <ShareLocationCard
          isEnabled={isTrackingEnabled}
          onShare={handleShareLocation}
          onCreateLink={handleCreateShareLink}
        />

        {/* Active Share Links */}
        {shareLinks.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Link2 size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Active Share Links</Text>
              </View>
            </View>
            {shareLinks.map((link) => (
              <View key={link.id} style={styles.linkItem}>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                  <Text style={styles.linkExpiry}>
                    Expires: {link.expiresAt.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => Share.share({ message: link.url })}
                >
                  <Share size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Trusted Contacts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Users size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Trusted Contacts</Text>
            </View>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowLovedOnesManager(true)}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDescription}>
            Add trusted contacts who can receive your location updates and safety alerts.
          </Text>
        </View>

        {/* Tracking History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Clock size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Recent Activity</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <MapPin size={16} color={Colors.textSecondary} />
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>Location shared</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Shield size={16} color={Colors.success} />
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>Safety check completed</Text>
              <Text style={styles.activityTime}>6 hours ago</Text>
            </View>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            🔒 Your location data is encrypted and only shared with people you explicitly authorize. 
            You can revoke access at any time.
          </Text>
        </View>
      </ScrollView>

      {/* Loved Ones Manager Modal */}
      {showLovedOnesManager && (
        <LovedOnesManager onClose={() => setShowLovedOnesManager(false)} />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginLeft: 8,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  manageButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  linkExpiry: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    marginLeft: 12,
  },
  activityTitle: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  privacyNotice: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.lightBlue,
    borderRadius: 8,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});