import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SafetyScore } from '@/types';
import { ApiService } from '@/services/ApiService';
import { MockDataService } from '@/services/MockDataService';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  safetyScore: SafetyScore;
  setSafetyScore: (score: SafetyScore) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  useMockData: boolean;
  setUseMockData: (useMock: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [safetyScore, setSafetyScore] = useState<SafetyScore>({
    score: 75,
    riskLevel: 'medium',
    reasons: ['Moderate crowd density', 'Good weather conditions'],
    modelVersion: '1.0'
  });
  const [isOnline, setIsOnline] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  // Load mock data when enabled
  useEffect(() => {
    if (useMockData) {
      loadMockUser();
    }
  }, [useMockData]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const mockDataSetting = await AsyncStorage.getItem('use_mock_data');
      
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      if (mockDataSetting) {
        setUseMockData(JSON.parse(mockDataSetting));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockUser = () => {
    const mockUser = MockDataService.getDemoUser();
    setUser(mockUser);
    setSafetyScore({
      score: 85,
      riskLevel: 'low',
      reasons: ['Demo mode - simulated safe conditions'],
      modelVersion: 'demo-1.0'
    });
  };

  const handleSetUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user_data');
    }
  };

  const handleSetUseMockData = async (useMock: boolean) => {
    setUseMockData(useMock);
    await AsyncStorage.setItem('use_mock_data', JSON.stringify(useMock));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['user_data', 'auth_token', 'digital_id']);
  };

  const value: AppContextType = {
    user,
    setUser: handleSetUser,
    safetyScore,
    setSafetyScore,
    isOnline,
    setIsOnline,
    useMockData,
    setUseMockData: handleSetUseMockData,
    logout,
    isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};