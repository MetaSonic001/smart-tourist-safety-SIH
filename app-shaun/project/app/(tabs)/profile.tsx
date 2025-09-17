import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, QrCode, Calendar, Phone, Mail, MapPin, CreditCard as Edit3, Shield, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppContext } from '@/contexts/AppContext';
import { DigitalIDCard } from '@/components/DigitalIDCard';
import { ItineraryManager } from '@/components/ItineraryManager';
import { EmergencyContacts } from '@/components/EmergencyContacts';

export default function ProfileScreen() {
  const { user } = useAppContext();
  const [showItineraryManager, setShowItineraryManager] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={Colors.white} />
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.verificationBadge}>
              <Shield size={14} color={Colors.success} />
              <Text style={styles.verificationText}>Verified Tourist</Text>
            </View>
          </View>
        </View>

        {/* Digital ID Card */}
        <DigitalIDCard digitalId={user.digitalId} showExpanded={true} />

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Days Remaining</Text>
          </View>
          <View style={styles.statItem}>
            <MapPin size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Places Visited</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
        </View>

        {/* Profile Sections */}
        <View style={styles.sectionsContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoItem}>
              <User size={20} color={Colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Mail size={20} color={Colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Phone size={20} color={Colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
              </View>
            </View>
          </View>

          {/* Travel Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Travel Itinerary</Text>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => setShowItineraryManager(true)}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {user.itinerary && user.itinerary.length > 0 ? (
              user.itinerary.slice(0, 3).map((item, index) => (
                <View key={index} style={styles.itineraryItem}>
                  <MapPin size={16} color={Colors.primary} />
                  <View style={styles.itineraryText}>
                    <Text style={styles.itineraryPlace}>{item.place}</Text>
                    <Text style={styles.itineraryDuration}>{item.duration}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No itinerary added yet</Text>
            )}
          </View>

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => setShowEmergencyContacts(true)}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
              user.emergencyContacts.slice(0, 2).map((contact, index) => (
                <View key={index} style={styles.contactItem}>
                  <Phone size={16} color={Colors.primary} />
                  <View style={styles.contactText}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No emergency contacts added</Text>
            )}
          </View>

          {/* Digital ID QR */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Digital ID QR Code</Text>
              <TouchableOpacity style={styles.shareButton}>
                <QrCode size={20} color={Colors.primary} />
                <Text style={styles.shareButtonText}>Show QR</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.qrDescription}>
              Use this QR code for quick verification at checkpoints and tourist facilities.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {showItineraryManager && (
        <ItineraryManager onClose={() => setShowItineraryManager(false)} />
      )}
      {showEmergencyContacts && (
        <EmergencyContacts onClose={() => setShowEmergencyContacts(false)} />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verificationText: {
    ...Typography.caption,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
  },
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itineraryText: {
    marginLeft: 12,
  },
  itineraryPlace: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  itineraryDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
  },
  contactName: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  contactPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.lightBlue,
  },
  shareButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  qrDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
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
});