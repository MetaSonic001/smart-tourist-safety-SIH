import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'police' | 'tourism' | 'operator_112' | 'hotel' | 'tourist';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  badge?: string;
  unit?: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
  useMockMode: boolean;
  setUseMockMode: (mock: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for immediate testing
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@demo.local': {
    password: 'Admin@1234',
    user: {
      id: 'admin-1',
      email: 'admin@demo.local',
      role: 'admin',
      name: 'Admin User',
      badge: 'ADM001',
      permissions: ['*']
    }
  },
  'police1@demo.local': {
    password: 'Police@1234',
    user: {
      id: 'police-1',
      email: 'police1@demo.local',
      role: 'police',
      name: 'Officer Sarah Chen',
      badge: 'POL001',
      unit: 'District 1',
      permissions: ['incidents.read', 'incidents.assign', 'digital_id.verify', 'zones.read']
    }
  },
  'tourism1@demo.local': {
    password: 'Tourism@1234',
    user: {
      id: 'tourism-1',
      email: 'tourism1@demo.local',
      role: 'tourism',
      name: 'Tourism Officer Raj Patel',
      badge: 'TOU001',
      unit: 'Tourism Board',
      permissions: ['incidents.read', 'digital_id.verify', 'zones.read', 'tourist.read']
    }
  },
  'operator112@demo.local': {
    password: 'Operator@1234',
    user: {
      id: 'operator-1',
      email: 'operator112@demo.local',
      role: 'operator_112',
      name: '112 Operator Maya Singh',
      badge: 'OPR001',
      unit: 'Emergency Response',
      permissions: ['incidents.create', 'incidents.assign', 'calls.handle', 'emergency.dispatch']
    }
  },
  'hotel1@demo.local': {
    password: 'Hotel@1234',
    user: {
      id: 'hotel-1',
      email: 'hotel1@demo.local',
      role: 'hotel',
      name: 'Hotel Manager',
      badge: 'HTL001',
      unit: 'Grand Palace Hotel',
      permissions: ['incidents.read', 'digital_id.verify']
    }
  },
  'tourist_demo@demo.local': {
    password: 'Tourist@1234',
    user: {
      id: 'tourist-1',
      email: 'tourist_demo@demo.local',
      role: 'tourist',
      name: 'Demo Tourist',
      permissions: ['incidents.view_own']
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockMode, setUseMockMode] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedAuth = localStorage.getItem('authority_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.user && parsed.expiresAt > Date.now()) {
          setUser(parsed.user);
        } else {
          localStorage.removeItem('authority_auth');
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('authority_auth');
      }
    }
    
    // Check for mock mode preference
    const mockMode = localStorage.getItem('authority_mock_mode');
    if (mockMode !== null) {
      setUseMockMode(JSON.parse(mockMode));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      if (useMockMode) {
        // Demo mode - use hardcoded credentials
        const demoUser = DEMO_USERS[email];
        if (demoUser && demoUser.password === password) {
          const authData = {
            user: demoUser.user,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
          };
          localStorage.setItem('authority_auth', JSON.stringify(authData));
          setUser(demoUser.user);
          toast({
            title: "Login Successful",
            description: `Welcome, ${demoUser.user.name}`,
          });
          return true;
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid credentials. Use demo credentials from documentation.",
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Production mode - call real auth API
        const response = await fetch('http://localhost:8001/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          const authData = {
            user: data.user,
            token: data.token,
            expiresAt: Date.now() + (8 * 60 * 60 * 1000)
          };
          localStorage.setItem('authority_auth', JSON.stringify(authData));
          setUser(data.user);
          toast({
            title: "Login Successful",
            description: `Welcome, ${data.user.name}`,
          });
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Login Failed",
            description: error.message || "Authentication failed",
            variant: "destructive",
          });
          return false;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Network error. Ensure backend services are running.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authority_auth');
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const switchRole = (role: UserRole) => {
    if (!useMockMode) {
      toast({
        title: "Role Switch Unavailable",
        description: "Role switching is only available in demo mode.",
        variant: "destructive",
      });
      return;
    }

    // Find a demo user with the requested role
    const demoUser = Object.values(DEMO_USERS).find(u => u.user.role === role);
    if (demoUser) {
      const authData = {
        user: demoUser.user,
        expiresAt: Date.now() + (8 * 60 * 60 * 1000)
      };
      localStorage.setItem('authority_auth', JSON.stringify(authData));
      setUser(demoUser.user);
      toast({
        title: "Role Switched",
        description: `Now logged in as ${demoUser.user.name} (${role})`,
      });
    }
  };

  const toggleMockMode = (mock: boolean) => {
    setUseMockMode(mock);
    localStorage.setItem('authority_mock_mode', JSON.stringify(mock));
    if (mock && !user) {
      // Auto-login as admin in mock mode for convenience
      login('admin@demo.local', 'Admin@1234');
    }
  };

  const value = {
    user,
    login,
    logout,
    switchRole,
    isLoading,
    useMockMode,
    setUseMockMode: toggleMockMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(permission);
};