import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Shield,
  Database,
  Bell,
  Globe,
  Palette,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Save,
  RotateCcw,
  Lock,
  Users,
  Activity,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const Settings = () => {
  const { user, useMockMode, setUseMockMode } = useAuth();
  
  // System Settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  
  // Privacy & Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('8');
  const [auditLogging, setAuditLogging] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');
  
  // API & Integration
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [mockDataMode, setMockDataMode] = useState(useMockMode);
  const [apiTimeout, setApiTimeout] = useState('30');
  const [maxRetries, setMaxRetries] = useState('3');

  const handleSaveSettings = () => {
    // Update mock mode through auth context
    setUseMockMode(mockDataMode);
    
    // Save other settings to localStorage
    const settings = {
      theme,
      language,
      timezone,
      notifications: {
        email: emailNotifications,
        push: pushNotifications,
        sound: soundAlerts,
        emergency: emergencyAlerts
      },
      security: {
        twoFactor: twoFactorAuth,
        sessionTimeout,
        auditLogging,
        dataRetention
      },
      api: {
        realTimeUpdates,
        timeout: apiTimeout,
        maxRetries
      }
    };
    
    localStorage.setItem('authority_settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully."
    });
  };

  const handleResetSettings = () => {
    // Reset to defaults
    setTheme('system');
    setLanguage('en');
    setTimezone('Asia/Kolkata');
    setEmailNotifications(true);
    setPushNotifications(true);
    setSoundAlerts(true);
    setEmergencyAlerts(true);
    setTwoFactorAuth(false);
    setSessionTimeout('8');
    setAuditLogging(true);
    setDataRetention('90');
    setRealTimeUpdates(true);
    setMockDataMode(true);
    setApiTimeout('30');
    setMaxRetries('3');
    
    localStorage.removeItem('authority_settings');
    
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to default values."
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your authority portal preferences and system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} className="bg-gradient-primary text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* User Profile Info */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Current user information and role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <Badge variant="outline" className="w-fit">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Badge/Unit</Label>
              <p className="text-sm text-muted-foreground">{user?.badge || user?.unit || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={theme} 
                onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                  <SelectItem value="or">ଓଡ଼ିଆ (Odia)</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {soundAlerts ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Sound Alerts
                </Label>
                <p className="text-sm text-muted-foreground">Audible notifications</p>
              </div>
              <Switch checked={soundAlerts} onCheckedChange={setSoundAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-emergency">
                  <Shield className="h-4 w-4" />
                  Emergency Alerts
                </Label>
                <p className="text-sm text-muted-foreground">High priority SOS alerts</p>
              </div>
              <Switch checked={emergencyAlerts} onCheckedChange={setEmergencyAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your security preferences and data protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Track all user activities</p>
              </div>
              <Switch checked={auditLogging} onCheckedChange={setAuditLogging} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention (days)</Label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* API & Integration Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API & Integration
            </CardTitle>
            <CardDescription>
              Configure system integrations and data sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {realTimeUpdates ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                  Real-time Updates
                </Label>
                <p className="text-sm text-muted-foreground">WebSocket live data feed</p>
              </div>
              <Switch checked={realTimeUpdates} onCheckedChange={setRealTimeUpdates} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Mock Data Mode
                </Label>
                <p className="text-sm text-muted-foreground">Use demo data when APIs unavailable</p>
              </div>
              <Switch checked={mockDataMode} onCheckedChange={setMockDataMode} />
            </div>

            {mockDataMode && (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning-foreground">
                  <Badge className="bg-warning text-warning-foreground mr-2">DEMO MODE</Badge>
                  Currently using mock data for demonstration purposes
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-timeout">API Timeout (seconds)</Label>
              <Select value={apiTimeout} onValueChange={setApiTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-retries">Max Retry Attempts</Label>
              <Select value={maxRetries} onValueChange={setMaxRetries}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No retries</SelectItem>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system status and version information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="font-medium">v2.1.0</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Build</div>
              <div className="font-medium">20241201-prod</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">API Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="font-medium text-success">Online</span>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Last Update</div>
              <div className="font-medium">2 minutes ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};