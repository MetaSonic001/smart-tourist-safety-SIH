import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, Globe, Shield, Database, CircleHelp as HelpCircle, LogOut, ChevronRight, Moon, Vibrate, Volume2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppContext } from '@/contexts/AppContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { user, useMockData, setUseMockData, logout } = useAppContext();
  const [notifications, setNotifications] = useState(true);
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your offline data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached map data and offline content. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared'), style: 'destructive' }
      ]
    );
  };

  const showPrivacyPolicy = () => {
    router.push('/privacy');
  };

  const showHelp = () => {
    router.push('/help');
  };

  const SettingItem = ({ icon: Icon, title, subtitle, value, onValueChange, showChevron = false, onPress }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <View style={styles.settingLeft}>
        <Icon size={24} color={Colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {typeof value === 'boolean' && onValueChange ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        ) : typeof value === 'string' ? (
          <Text style={styles.settingValue}>{value}</Text>
        ) : null}
        {showChevron && <ChevronRight size={20} color={Colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your SafeTour experience</Text>
        </View>

        {/* Development Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development</Text>
          <SettingItem
            icon={Database}
            title="Use Mock Data"
            subtitle="Use local demo data instead of server"
            value={useMockData}
            onValueChange={setUseMockData}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Alerts</Text>
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Safety alerts and updates"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingItem
            icon={Volume2}
            title="Voice Alerts"
            subtitle="Audio safety warnings"
            value={voiceAlerts}
            onValueChange={setVoiceAlerts}
          />
          <SettingItem
            icon={Vibrate}
            title="Vibration"
            subtitle="Haptic feedback for alerts"
            value={vibration}
            onValueChange={setVibration}
          />
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingItem
            icon={Moon}
            title="Dark Mode"
            subtitle="Use dark theme"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingItem
            icon={Globe}
            title="Language"
            subtitle="Change app language"
            value={language}
            showChevron
            onPress={() => Alert.alert('Language', 'Language selection coming soon')}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingItem
            icon={Shield}
            title="Privacy Policy"
            subtitle="View our privacy policy"
            showChevron
            onPress={showPrivacyPolicy}
          />
          <SettingItem
            icon={Database}
            title="Clear Cache"
            subtitle="Remove offline data and maps"
            showChevron
            onPress={handleClearCache}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon={HelpCircle}
            title="Help & Support"
            subtitle="Get help with SafeTour"
            showChevron
            onPress={showHelp}
          />
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoTitle}>Account Information</Text>
            <Text style={styles.userInfoText}>Digital ID: {user.digitalId}</Text>
            <Text style={styles.userInfoText}>Email: {user.email}</Text>
            <Text style={styles.userInfoText}>App Version: 1.0.0</Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SafeTour v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for tourist safety</Text>
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  userInfo: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 12,
  },
  userInfoText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },
  logoutText: {
    ...Typography.body,
    color: Colors.error,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});