import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QrCode, Calendar, Shield, Eye } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface DigitalIDCardProps {
  digitalId: string;
  showExpanded?: boolean;
}

export const DigitalIDCard: React.FC<DigitalIDCardProps> = ({ 
  digitalId, 
  showExpanded = false 
}) => {
  const formatExpiryDate = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 5); // 5 days remaining
    return expiryDate.toLocaleDateString();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Shield size={20} color={Colors.white} />
          <Text style={styles.title}>Digital Tourist ID</Text>
        </View>
        <TouchableOpacity style={styles.qrButton}>
          <QrCode size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>ID Number</Text>
          <Text style={styles.idNumber}>{digitalId}</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Calendar size={16} color={Colors.white} />
            <View style={styles.statusText}>
              <Text style={styles.statusLabel}>Expires</Text>
              <Text style={styles.statusValue}>{formatExpiryDate()}</Text>
            </View>
          </View>
          
          <View style={styles.verificationBadge}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {showExpanded && (
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Eye size={16} color={Colors.primary} />
            <Text style={styles.viewDetailsText}>View Full Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primaryDark,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.body,
    color: Colors.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  qrButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: 20,
  },
  idContainer: {
    marginBottom: 16,
  },
  idLabel: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  idNumber: {
    ...Typography.h2,
    color: Colors.white,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
  },
  statusLabel: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.8,
  },
  statusValue: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: 'bold',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  viewDetailsText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});