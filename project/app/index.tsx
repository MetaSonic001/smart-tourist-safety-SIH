import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, MapPin, Users, CircleCheck as CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
      if (onboardingStatus === 'true') {
        setHasSeenOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleGetStarted = () => {
    if (hasSeenOnboarding) {
      router.replace('/(tabs)');
    } else {
      router.push('/onboarding');
    }
  };

  const handleQRScan = () => {
    Alert.alert(
      'QR Code Scanner',
      'Scan the QR code provided at the airport, hotel, or checkpoint to download and register.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Scanner', onPress: () => Alert.alert('Scanner', 'Opening QR code scanner...') }
      ]
    );
  };

  const features = [
    {
      icon: Shield,
      title: 'Real-time Safety',
      description: 'AI-powered safety scoring and alerts'
    },
    {
      icon: MapPin,
      title: 'Smart Navigation',
      description: 'Risk-aware routing and geo-fencing'
    },
    {
      icon: Users,
      title: 'Emergency SOS',
      description: 'Instant help with one-touch alerts'
    },
    {
      icon: CheckCircle,
      title: 'Digital Identity',
      description: 'Blockchain-verified tourist ID'
    }
  ];

  return (
    <LinearGradient
      colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo and Tagline */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Shield size={64} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>SafeTours</Text>
          <Text style={styles.tagline}>Travel Smart. Travel Safe.</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <feature.icon size={24} color="#3B82F6" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Download via QR Code at Airport/Hotel
          </Text>
          <Text style={styles.ctaSubtitle}>
            Or get started directly if you already have the app
          </Text>

          <TouchableOpacity style={styles.qrButton} onPress={handleQRScan}>
            <Text style={styles.qrButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>
              {hasSeenOnboarding ? 'Continue to App' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  ctaSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  waveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});
