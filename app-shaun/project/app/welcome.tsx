import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, MapPin, Phone, Users } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.replace('/onboarding');
  };

  const handleExploreDemo = () => {
    // Set mock data mode and navigate to home
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.gradient}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.logoContainer}>
            <Shield size={60} color={Colors.white} />
          </View>
          <Text style={styles.title}>SafeTour</Text>
          <Text style={styles.subtitle}>Explore confidently</Text>
          <Text style={styles.description}>
            Smart Geo-safety, SOS, and verified Digital IDs for tourists
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MapPin size={32} color={Colors.white} />
            <Text style={styles.featureText}>Real-time Safety Zones</Text>
          </View>
          <View style={styles.featureItem}>
            <Phone size={32} color={Colors.white} />
            <Text style={styles.featureText}>Emergency SOS</Text>
          </View>
          <View style={styles.featureItem}>
            <Users size={32} color={Colors.white} />
            <Text style={styles.featureText}>Share with Loved Ones</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleExploreDemo}>
            <Text style={styles.secondaryButtonText}>Explore Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your safety is our priority. All data is encrypted and secure.
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  description: {
    ...Typography.body,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 280,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureText: {
    ...Typography.body,
    color: Colors.white,
    marginLeft: 16,
    fontSize: 18,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
  },
});