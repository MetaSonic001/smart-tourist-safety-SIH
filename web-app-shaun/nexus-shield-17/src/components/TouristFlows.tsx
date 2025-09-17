import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Heart, 
  FileText, 
  Globe, 
  Camera, 
  Clock,
  CheckCircle,
  UserPlus,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface TouristProfile {
  id: string;
  name: string;
  passport: string;
  phone: string;
  email: string;
  emergencyContact: string;
  language: string;
  locationSharing: boolean;
  checkInStatus: 'checked-in' | 'overdue' | 'emergency' | 'safe';
  lastLocation: string;
  digitalIdStatus: 'active' | 'expired' | 'pending';
}

export const TouristFlows: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [touristData, setTouristData] = useState({
    name: '',
    passport: '',
    phone: '',
    email: '',
    emergencyContact: '',
    language: 'en',
    locationSharing: true,
  });

  const [mockTourists] = useState<TouristProfile[]>([
    {
      id: 'T001',
      name: 'Sarah Johnson',
      passport: 'US123456789',
      phone: '+1-555-0123',
      email: 'sarah.j@email.com',
      emergencyContact: '+1-555-0456',
      language: 'English',
      locationSharing: true,
      checkInStatus: 'safe',
      lastLocation: 'Red Fort, Delhi',
      digitalIdStatus: 'active'
    },
    {
      id: 'T002', 
      name: 'Hans Mueller',
      passport: 'DE987654321',
      phone: '+49-555-0789',
      email: 'h.mueller@email.com',
      emergencyContact: '+49-555-0012',
      language: 'German',
      locationSharing: false,
      checkInStatus: 'overdue',
      lastLocation: 'India Gate, Delhi',
      digitalIdStatus: 'active'
    },
    {
      id: 'T003',
      name: 'Akiko Tanaka',
      passport: 'JP456789123', 
      phone: '+81-555-0345',
      email: 'a.tanaka@email.com',
      emergencyContact: '+81-555-0678',
      language: 'Japanese',
      locationSharing: true,
      checkInStatus: 'emergency',
      lastLocation: 'Chandni Chowk, Delhi',
      digitalIdStatus: 'active'
    }
  ]);

  const handleFlowAction = (flowType: string, action: string) => {
    setActiveFlow(`${flowType}-${action}`);
    
    toast({
      title: "Demo Action Triggered",
      description: `${flowType} - ${action} flow demonstrated`,
    });

    // Auto-reset after demo
    setTimeout(() => {
      setActiveFlow(null);
    }, 3000);
  };

  const handleTouristRegistration = () => {
    if (!touristData.name || !touristData.passport || !touristData.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Tourist Registered Successfully!",
      description: `Digital ID created for ${touristData.name}. Blockchain verification in progress.`,
    });

    // Reset form
    setTouristData({
      name: '',
      passport: '',
      phone: '',
      email: '',
      emergencyContact: '',
      language: 'en',
      locationSharing: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe': return <Badge variant="outline" className="bg-success/10 text-success border-success">Safe</Badge>;
      case 'overdue': return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning">Check-in Overdue</Badge>;
      case 'emergency': return <Badge variant="destructive" className="emergency-pulse">Emergency</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tourist Scenario Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Registration Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Tourist Registration
            </CardTitle>
            <CardDescription>
              Onboard new tourists with digital ID creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Registration', 'New Tourist Arrival')}
            >
              <User className="h-4 w-4 mr-2" />
              New Tourist Arrival
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Registration', 'Digital ID Creation')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Digital ID Creation
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Registration', 'Blockchain Verification')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Blockchain Verification
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-emergency" />
              Emergency Scenarios
            </CardTitle>
            <CardDescription>
              Handle tourist distress and emergency situations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Emergency', 'SOS Panic Button')}
            >
              <Phone className="h-4 w-4 mr-2" />
              SOS Panic Button
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start border-warning text-warning"
              onClick={() => handleFlowAction('Emergency', 'Medical Emergency')}
            >
              <Heart className="h-4 w-4 mr-2" />
              Medical Emergency
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start border-info text-info"
              onClick={() => handleFlowAction('Emergency', 'Tourist Missing')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Tourist Missing
            </Button>
          </CardContent>
        </Card>

        {/* Zone Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5 text-secondary-dark" />
              Zone Management
            </CardTitle>
            <CardDescription>
              Geofence alerts and zone monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Zone', 'Unsafe Zone Entry')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Unsafe Zone Entry
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Zone', 'Mass Alert Broadcast')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Mass Alert Broadcast
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => handleFlowAction('Zone', 'Check-in Reminder')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Check-in Reminder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Flow Display */}
      {activeFlow && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Demo Flow Active: {activeFlow}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              This demo flow will auto-reset in a few seconds...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tourist Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            New Tourist Registration
          </CardTitle>
          <CardDescription>
            Register a new tourist and create their digital identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter tourist's full name"
                value={touristData.name}
                onChange={(e) => setTouristData({...touristData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport">Passport Number *</Label>
              <Input
                id="passport"
                placeholder="Passport or ID number"
                value={touristData.passport}
                onChange={(e) => setTouristData({...touristData, passport: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1-xxx-xxx-xxxx"
                value={touristData.phone}
                onChange={(e) => setTouristData({...touristData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="tourist@email.com"
                value={touristData.email}
                onChange={(e) => setTouristData({...touristData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                placeholder="Emergency contact number"
                value={touristData.emergencyContact}
                onChange={(e) => setTouristData({...touristData, emergencyContact: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={touristData.language} onValueChange={(value) => setTouristData({...touristData, language: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Location Sharing Preference</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enable continuous location sharing for enhanced safety monitoring
              </p>
            </div>
            <Button
              variant={touristData.locationSharing ? "default" : "outline"}
              size="sm"
              onClick={() => setTouristData({...touristData, locationSharing: !touristData.locationSharing})}
            >
              {touristData.locationSharing ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <Button onClick={handleTouristRegistration} className="w-full" size="lg">
            <Shield className="h-4 w-4 mr-2" />
            Create Digital ID & Register Tourist
          </Button>
        </CardContent>
      </Card>

      {/* Current Tourists Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Tourists ({mockTourists.length})
          </CardTitle>
          <CardDescription>
            Monitor registered tourists and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTourists.map((tourist) => (
              <div key={tourist.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{tourist.name}</h4>
                    {getStatusBadge(tourist.checkInStatus)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>ID: {tourist.id}</span>
                    <span>📱 {tourist.phone}</span>
                    <span>🌐 {tourist.language}</span>
                    <span>📍 {tourist.lastLocation}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFlowAction('Tourist', `View ${tourist.name} Details`)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {tourist.checkInStatus === 'emergency' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleFlowAction('Emergency', `Respond to ${tourist.name}`)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Respond
                    </Button>
                  )}
                  {tourist.checkInStatus === 'overdue' && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleFlowAction('Check-in', `Contact ${tourist.name}`)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};