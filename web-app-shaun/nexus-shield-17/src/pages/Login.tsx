import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import heroImage from '@/assets/professional-authority-bg.jpg';

export const Login = () => {
  const { user, login, isLoading, useMockMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const success = await login(email, password);
    if (!success) {
      setLoginError('Invalid credentials. Please check your email and password.');
    }
  };

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword);
  };

  const demoCredentials = [
    { role: 'Administrator', email: 'admin@demo.local', password: 'Admin@1234', color: 'bg-emergency' },
    { role: 'Police Officer', email: 'police1@demo.local', password: 'Police@1234', color: 'bg-primary' },
    { role: '112 Operator', email: 'operator112@demo.local', password: 'Operator@1234', color: 'bg-warning' },
    { role: 'Tourism Officer', email: 'tourism1@demo.local', password: 'Tourism@1234', color: 'bg-info' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/60 to-secondary/20"></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="text-white space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-12 w-12" />
              <div>
                <h1 className="text-4xl font-bold">Authority Portal</h1>
                <p className="text-blue-100">Secure Digital ID & Emergency Response System</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-lg">Real-time incident management & SOS response</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-lg">Blockchain-backed Digital ID verification</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-lg">Advanced risk heatmaps & zone monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-lg">Multi-agency coordination platform</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <Card className="w-full max-w-md mx-auto shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Access the Authority Portal with your credentials
              </CardDescription>
              
              {useMockMode && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 mx-auto">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Demo Mode Active
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@authority.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {loginError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {loginError}
                  </div>
                )}

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In to Authority Portal'}
                </Button>
              </form>

              {/* Demo Quick Login - Only in mock mode */}
              {useMockMode && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Demo Quick Login</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {demoCredentials.map((cred) => (
                      <Button
                        key={cred.email}
                        variant="outline"
                        size="sm"
                        onClick={() => quickLogin(cred.email, cred.password)}
                        className="text-xs h-auto py-2 px-3 flex flex-col items-center gap-1"
                      >
                        <div className={`w-2 h-2 rounded-full ${cred.color}`}></div>
                        <span>{cred.role}</span>
                      </Button>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    Demo credentials for immediate access. In production, use your official authority credentials.
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};