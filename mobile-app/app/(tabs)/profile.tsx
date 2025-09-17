import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
  Image
} from 'react-native';
import { User, Settings, Shield, Phone, Globe, Bell, Volume2, MapPin, CreditCard, LogOut, CreditCard as Edit, QrCode, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emergencySharing, setEmergencySharing] = useState(true);

  const userProfile = {
    name: 'Rahul Sharma',
    nationality: 'Indian',
    passportNumber: 'A1234567',
    digitalId: 'TID-2025-001234',
    photo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    tripDuration: 'Jan 15 - Jan 25, 2025',
    emergencyContacts: [
      { name: 'Wife - Priya Sharma', phone: '+91 98765 43210' },
      { name: 'Emergency Services', phone: '112' },
      { name: 'Tourist Helpline', phone: '1363' }
    ]
  };

  const languages = [
    'English', 'Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
  ];

  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const menuSections = [
    {
      title: 'Digital Identity',
      items: [
        { icon: CreditCard, title: 'Digital ID Card', subtitle: 'View your tourist ID', action: 'digitalId' },
        { icon: QrCode, title: 'QR Code', subtitle: 'Show verification code', action: 'qrCode' },
        { icon: Shield, title: 'Verification Status', subtitle: 'Blockchain verified', action: 'verification' }
      ]
    },
    {
      title: 'Emergency Settings',
      items: [
        { icon: Phone, title: 'Emergency Contacts', subtitle: '3 contacts added', action: 'contacts' },
        { icon: MapPin, title: 'SOS Preferences', subtitle: 'Configure emergency alerts', action: 'sosSettings' }
      ]
    },
    {
      title: 'App Preferences',
      items: [
        { icon: Globe, title: 'Language', subtitle: selectedLanguage, action: 'language' },
        { icon: Bell, title: 'Notifications', subtitle: 'Safety alerts & updates', action: 'notifications' },
        { icon: Volume2, title: 'Sound', subtitle: 'Alert sounds', action: 'sound' }
      ]
    }
  ];

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'digitalId':
        Alert.alert('Digital ID', 'Opening your digital tourist ID card...');
        break;
      case 'qrCode':
        Alert.alert('QR Code', 'Displaying QR code for verification...');
        break;
      case 'verification':
        Alert.alert('Verification Status', 'Your identity is blockchain verified ✅\n\nVerification Date: Jan 15, 2025\nValid Until: Jan 25, 2025');
        break;
      case 'contacts':
        Alert.alert('Emergency Contacts', userProfile.emergencyContacts.map(c => c.name + ': ' + c.phone).join('\n'));
        break;
      case 'sosSettings':
        Alert.alert('SOS Settings', 'Configure your emergency alert preferences...');
        break;
      case 'language':
        Alert.alert('Select Language', 'Choose your preferred language:\n\n' + languages.join(', '));
        break;
      case 'notifications':
      case 'sound':
        Alert.alert('Settings', 'Opening ' + action + ' settings...');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will disable safety monitoring until you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed Out', 'You have been signed out successfully.') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: userProfile.photo }} style={styles.profileImage} />
            <TouchableOpacity style={styles.editButton}>
              <Edit size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileNationality}>{userProfile.nationality}</Text>
            
            <View style={styles.idContainer}>
              <View style={styles.idBadge}>
                <Shield size={14} color="#10B981" />
                <Text style={styles.idText}>ID: {userProfile.digitalId}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✅ Verified</Text>
              </View>
            </View>
            
            <View style={styles.tripInfo}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.tripText}>Trip: {userProfile.tripDuration}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Settings */}
      <View style={styles.quickSettingsSection}>
        <Text style={styles.sectionTitle}>Quick Settings</Text>
        <View style={styles.quickSettingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#3B82F6" />
              <Text style={styles.settingLabel}>Safety Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MapPin size={20} color="#10B981" />
              <Text style={styles.settingLabel}>Location Tracking</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={locationEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Volume2 size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>Alert Sounds</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
              thumbColor={soundEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Shield size={20} color="#8B5CF6" />
              <Text style={styles.settingLabel}>Emergency Sharing</Text>
            </View>
            <Switch
              value={emergencySharing}
              onValueChange={setEmergencySharing}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={emergencySharing ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex < section.items.length - 1 && styles.menuItemBorder
                ]}
                onPress={() => handleMenuPress(item.action)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: getIconColor(item.action) + '20' }]}>
                    <item.icon size={20} color={getIconColor(item.action)} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const getIconColor = (action: string) => {
  switch (action) {
    case 'digitalId': return '#8B5CF6';
    case 'qrCode': return '#3B82F6';
    case 'verification': return '#10B981';
    case 'contacts': return '#EF4444';
    case 'sosSettings': return '#F59E0B';
    case 'language': return '#06B6D4';
    case 'notifications': return '#8B5CF6';
    case 'sound': return '#F59E0B';
    default: return '#6B7280';
  }
};

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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileNationality: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  idText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803D',
  },
  verifiedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripText: {
    fontSize: 13,
    color: '#6B7280',
  },
  quickSettingsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickSettingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  bottomSpacing: {
    height: 100,
  },
});