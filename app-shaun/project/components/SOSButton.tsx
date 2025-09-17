import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Alert } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { SOSService } from '@/services/SOSService';
import * as Haptics from 'expo-haptics';

interface SOSButtonProps {
  onPress: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    setIsPressed(true);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Start press animation
    Animated.timing(animatedValue, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Start progress animation
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Set timer for SOS trigger
    pressTimer.current = setTimeout(() => {
      handleSOSTrigger();
    }, 3000);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    // Clear timer
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Reset animations
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

    progressValue.setValue(0);
  };

  const handleSOSTrigger = async () => {
    // Double haptic feedback for trigger
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);

    Alert.alert(
      '🚨 SOS ALERT',
      'Emergency alert will be sent immediately!',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            setIsPressed(false);
            progressValue.setValue(0);
          }
        },
        { 
          text: 'Send SOS', 
          style: 'destructive',
          onPress: () => {
            SOSService.initiateSOS('manual', 'Emergency button pressed');
            onPress();
          }
        }
      ]
    );
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValue }] }]}>
      <TouchableOpacity
        style={[
          styles.button,
          isPressed && styles.buttonPressed
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.progressRing,
            {
              opacity: progressValue,
              transform: [{
                scale: progressValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }
          ]}
        />
        <Phone size={36} color={Colors.white} />
        <Text style={styles.buttonText}>SOS</Text>
        <Text style={styles.instructionText}>
          {isPressed ? 'Hold for 3s' : 'Press & Hold'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 30,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  buttonPressed: {
    backgroundColor: '#dc2626',
    elevation: 12,
    shadowOpacity: 0.4,
  },
  progressRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.white,
    opacity: 0,
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: 'bold',
    marginTop: 4,
  },
  instructionText: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
    textAlign: 'center',
  },
});