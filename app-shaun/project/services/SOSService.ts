import { SOSAlert } from '@/types';
import { ApiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';

class SOSService {
  private sosQueue: SOSAlert[] = [];
  
  async initiateSOS(type: 'manual' | 'voice' | 'automatic', description?: string): Promise<void> {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Create SOS alert
      const sosAlert: SOSAlert = {
        id: `sos-${Date.now()}`,
        digitalId: await this.getDigitalId(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: new Date().toISOString(),
        status: 'active',
        type,
        description,
      };

      // Try to send to server
      try {
        const response = await ApiService.createSOS({
          alertId: sosAlert.id,
          digitalId: sosAlert.digitalId,
          touristId: await this.getTouristId(),
          lat: sosAlert.location.latitude,
          lng: sosAlert.location.longitude,
          timestamp: sosAlert.timestamp,
          source: 'app',
          mediaRefs: [],
        });

        if (response.status === 'success') {
          await this.handleSOSSuccess(sosAlert);
        } else {
          throw new Error('Server request failed');
        }
      } catch (error) {
        // Queue for later if server fails
        await this.queueSOS(sosAlert);
        await this.handleOfflineSOS(sosAlert);
      }
    } catch (error) {
      console.error('SOS initiation failed:', error);
      Alert.alert('Error', 'Failed to initiate SOS. Please try again or call 112 directly.');
    }
  }

  private async handleSOSSuccess(sosAlert: SOSAlert) {
    // Show success notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 SOS Alert Sent',
        body: 'Emergency services have been notified. Help is on the way.',
        data: { sosId: sosAlert.id },
        sound: true,
      },
      trigger: null,
    });

    // Initiate emergency call
    this.makeEmergencyCall();

    // Announce via TTS
    Speech.speak('SOS alert sent successfully. Emergency services are being notified.', {
      language: 'en',
    });
  }

  private async handleOfflineSOS(sosAlert: SOSAlert) {
    // Show offline notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 SOS Alert (Offline)',
        body: 'Alert queued. Will send when connection is restored. Calling 112...',
        data: { sosId: sosAlert.id },
        sound: true,
      },
      trigger: null,
    });

    // Send SMS to emergency contacts
    await this.sendEmergencySMS(sosAlert);

    // Initiate emergency call
    this.makeEmergencyCall();
  }

  private async queueSOS(sosAlert: SOSAlert) {
    try {
      const existingQueue = await AsyncStorage.getItem('sos_queue');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      queue.push(sosAlert);
      await AsyncStorage.setItem('sos_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue SOS:', error);
    }
  }

  private async sendEmergencySMS(sosAlert: SOSAlert) {
    const message = `EMERGENCY: ${sosAlert.digitalId} needs help at location: https://maps.google.com/?q=${sosAlert.location.latitude},${sosAlert.location.longitude} - SafeTour Alert`;
    
    // Note: SMS sending requires native implementation or third-party service
    console.log('Emergency SMS would be sent:', message);
  }

  private makeEmergencyCall() {
    Alert.alert(
      'Emergency Call',
      'Call 112 for immediate assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          onPress: () => {
            Linking.openURL('tel:112');
          }
        }
      ]
    );
  }

  async processQueuedSOS() {
    try {
      const queueData = await AsyncStorage.getItem('sos_queue');
      if (!queueData) return;

      const queue: SOSAlert[] = JSON.parse(queueData);
      const processedIds: string[] = [];

      for (const sosAlert of queue) {
        try {
          const response = await ApiService.createSOS({
            alertId: sosAlert.id,
            digitalId: sosAlert.digitalId,
            touristId: await this.getTouristId(),
            lat: sosAlert.location.latitude,
            lng: sosAlert.location.longitude,
            timestamp: sosAlert.timestamp,
            source: 'app',
            mediaRefs: [],
          });

          if (response.status === 'success') {
            processedIds.push(sosAlert.id);
          }
        } catch (error) {
          console.error('Failed to process queued SOS:', sosAlert.id);
        }
      }

      // Remove processed items from queue
      if (processedIds.length > 0) {
        const remainingQueue = queue.filter(sos => !processedIds.includes(sos.id));
        await AsyncStorage.setItem('sos_queue', JSON.stringify(remainingQueue));
        
        // Notify user
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '✅ Queued SOS Alerts Sent',
            body: `${processedIds.length} emergency alert(s) successfully sent to authorities.`,
            sound: false,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error processing SOS queue:', error);
    }
  }

  private async getDigitalId(): Promise<string> {
    try {
      const digitalId = await AsyncStorage.getItem('digital_id');
      return digitalId || 'UNKNOWN';
    } catch (error) {
      return 'UNKNOWN';
    }
  }

  private async getTouristId(): Promise<string> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 'UNKNOWN';
      }
      return 'UNKNOWN';
    } catch (error) {
      return 'UNKNOWN';
    }
  }
}

export const SOSService = new SOSService();