import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  MapPin, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Globe,
  Zap,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Activity,
      title: 'Real-time Command Center',
      description: 'Live monitoring of incidents, SOS alerts, and zone risk assessment with instant notifications',
      stats: '24/7 Live Updates'
    },
    {
      icon: MapPin,
      title: 'Advanced Heatmapping',
      description: 'ML-powered risk analysis with predictive hotspot identification and zone-based incident tracking',
      stats: '95% Accuracy'
    },
    {
      icon: Shield,
      title: 'Blockchain Digital IDs',
      description: 'Immutable tourist identity verification with privacy-preserving consent management',
      stats: 'Secure & Private'
    },
    {
      icon: Users,
      title: 'Multi-Agency Coordination',
      description: 'Seamless collaboration between police, tourism officers, hotels, and emergency services',
      stats: '6 User Roles'
    }
  ];

  const stats = [
    { value: '99.7%', label: 'System Uptime' },
    { value: '2.3min', label: 'Avg Response Time' },
    { value: '50K+', label: 'Digital IDs Verified' },
    { value: '24/7', label: 'Emergency Support' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Professional Overlay */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Professional Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/src/assets/authority-hero.jpg')` }}
        />
        
        {/* Professional gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-transparent" />
        
        {/* Animated grid pattern for tech feel */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '50px 50px'
               }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-left">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Globe className="w-4 h-4 mr-2" />
                Secure • Intelligent • Connected
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-white leading-tight">
                Authority
                <span className="block text-transparent bg-gradient-to-r from-white to-white/80 bg-clip-text">
                  Command Center
                </span>
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                Advanced tourist safety platform with real-time monitoring, blockchain-verified digital IDs, 
                and AI-powered risk assessment for comprehensive public safety management.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/login')}
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg h-auto"
                >
                  Access Command Center
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg h-auto"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Live Demo
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Dashboard Preview */}
            <div className="lg:block hidden">
              <Card className="bg-white/10 backdrop-blur border-white/20 shadow-2xl">
                <CardHeader className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <span className="text-sm">Live Command Center</span>
                  </div>
                  <CardTitle className="text-2xl">Real-time Operations</CardTitle>
                </CardHeader>
                <CardContent className="text-white/80">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                      <span>Active Incidents</span>
                      <Badge className="bg-warning text-warning-foreground">23</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                      <span>SOS Alerts</span>
                      <Badge className="bg-emergency text-emergency-foreground emergency-pulse">5</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                      <span>Digital IDs Verified</span>
                      <Badge className="bg-success text-success-foreground">12,450</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Comprehensive Safety Platform</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powered by advanced technology and designed for multi-agency coordination, 
              ensuring tourist safety through intelligent monitoring and rapid response.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-elevated transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">{feature.stats}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section className="py-20 bg-card">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Demo Access</h2>
          <p className="text-muted-foreground mb-8">
            Experience different user roles with these demo credentials:
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { role: 'Administrator', email: 'admin@demo.local', badge: 'Full Access' },
              { role: 'Police Officer', email: 'police1@demo.local', badge: 'Incident Management' },
              { role: 'Tourism Officer', email: 'tourism1@demo.local', badge: 'Tourist Support' },
              { role: '112 Operator', email: 'operator112@demo.local', badge: 'Emergency Response' },
              { role: 'Hotel Staff', email: 'hotel1@demo.local', badge: 'Guest Services' },
              { role: 'Tourist View', email: 'tourist_demo@demo.local', badge: 'Limited Access' }
            ].map((demo, index) => (
              <Card key={index} className="text-left">
                <CardContent className="p-4">
                  <div className="font-medium mb-1">{demo.role}</div>
                  <div className="text-sm text-muted-foreground mb-2">{demo.email}</div>
                  <Badge variant="secondary" className="text-xs">{demo.badge}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Password for all demo accounts: <code className="bg-muted px-2 py-1 rounded">Password@1234</code>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Secure Your Operations?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join authorities worldwide using our platform for enhanced public safety and tourist protection.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg h-auto"
          >
            Start Your Mission
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;