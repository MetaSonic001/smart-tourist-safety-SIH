import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  User, 
  Search, 
  Filter, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth, hasPermission } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  badge?: string;
  unit?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
  avatar?: string;
  location?: string;
}

export const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Mock user data
      const mockUsers: SystemUser[] = [
        {
          id: 'user-1',
          name: 'Admin User',
          email: 'admin@demo.local',
          role: 'admin',
          status: 'active',
          badge: 'ADM001',
          unit: 'Central Command',
          phone: '+91 98765 43210',
          lastLogin: new Date(Date.now() - 5 * 60 * 1000),
          createdAt: new Date('2024-01-15'),
          permissions: ['*'],
          location: 'Delhi HQ'
        },
        {
          id: 'user-2',
          name: 'Officer Sarah Chen',
          email: 'police1@demo.local',
          role: 'police',
          status: 'active',
          badge: 'POL001',
          unit: 'District 1',
          phone: '+91 98765 43211',
          lastLogin: new Date(Date.now() - 15 * 60 * 1000),
          createdAt: new Date('2024-02-10'),
          permissions: ['incidents.read', 'incidents.assign', 'digital_id.verify', 'zones.read'],
          location: 'Connaught Place'
        },
        {
          id: 'user-3',
          name: 'Tourism Officer Raj Patel',
          email: 'tourism1@demo.local',
          role: 'tourism',
          status: 'active',
          badge: 'TOU001',
          unit: 'Tourism Board',
          phone: '+91 98765 43212',
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date('2024-02-15'),
          permissions: ['incidents.read', 'digital_id.verify', 'zones.read', 'tourist.read'],
          location: 'India Gate'
        },
        {
          id: 'user-4',
          name: '112 Operator Maya Singh',
          email: 'operator112@demo.local',
          role: 'operator_112',
          status: 'active',
          badge: 'OPR001',
          unit: 'Emergency Response',
          phone: '+91 98765 43213',
          lastLogin: new Date(),
          createdAt: new Date('2024-03-01'),
          permissions: ['incidents.create', 'incidents.assign', 'calls.handle', 'emergency.dispatch'],
          location: '112 Command Center'
        },
        {
          id: 'user-5',
          name: 'Hotel Manager Kumar',
          email: 'hotel1@demo.local',
          role: 'hotel',
          status: 'active',
          badge: 'HTL001',
          unit: 'Grand Palace Hotel',
          phone: '+91 98765 43214',
          lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
          createdAt: new Date('2024-03-10'),
          permissions: ['incidents.read', 'digital_id.verify'],
          location: 'Karol Bagh'
        },
        {
          id: 'user-6',
          name: 'Officer Inactive',
          email: 'inactive@demo.local',
          role: 'police',
          status: 'inactive',
          badge: 'POL002',
          unit: 'District 2',
          phone: '+91 98765 43215',
          lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date('2024-01-20'),
          permissions: ['incidents.read'],
          location: 'Offline'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      toast({
        title: "Error Loading Users",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.badge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'inactive': return <Clock className="h-4 w-4 text-warning" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-danger" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-warning text-warning-foreground';
      case 'suspended': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'police': return <Shield className="h-4 w-4" />;
      case 'tourism': return <MapPin className="h-4 w-4" />;
      case 'operator_112': return <Phone className="h-4 w-4" />;
      case 'hotel': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-primary/20 text-primary';
      case 'police': return 'border-danger/20 text-danger';
      case 'tourism': return 'border-info/20 text-info';
      case 'operator_112': return 'border-warning/20 text-warning';
      case 'hotel': return 'border-secondary/20 text-secondary-dark';
      default: return 'border-muted/20 text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateUser = () => {
    const newUser: SystemUser = {
      id: `user-${Date.now()}`,
      name: 'New User',
      email: 'newuser@demo.local',
      role: 'police',
      status: 'active',
      badge: 'NEW001',
      unit: 'Unassigned',
      phone: '+91 98765 00000',
      createdAt: new Date(),
      permissions: ['incidents.read'],
      location: 'Headquarters'
    };

    setUsers(prev => [newUser, ...prev]);
    setIsCreateDialogOpen(false);
    toast({
      title: "User Created",
      description: `User "${newUser.name}" has been created successfully.`
    });
  };

  const handleUpdateUserStatus = (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: newStatus }
        : u
    ));

    const userName = users.find(u => u.id === userId)?.name;
    toast({
      title: "User Status Updated",
      description: `${userName} status changed to ${newStatus}`
    });
  };

  const handleDeleteUser = (userId: string) => {
    const userName = users.find(u => u.id === userId)?.name;
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: "User Deleted",
      description: `User "${userName}" has been removed from the system.`
    });
  };

  const canManageUsers = hasPermission(user, 'users.write') || user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and access permissions
          </p>
        </div>
        {canManageUsers && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the authority portal system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-name">Full Name</Label>
                    <Input id="user-name" placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label htmlFor="user-email">Email Address</Label>
                    <Input id="user-email" type="email" placeholder="user@domain.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-role">Role</Label>
                    <Select defaultValue="police">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="police">Police Officer</SelectItem>
                        <SelectItem value="tourism">Tourism Officer</SelectItem>
                        <SelectItem value="operator_112">112 Operator</SelectItem>
                        <SelectItem value="hotel">Hotel Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-badge">Badge Number</Label>
                    <Input id="user-badge" placeholder="Badge/ID number" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user-unit">Unit/Department</Label>
                  <Input id="user-unit" placeholder="Unit or department assignment" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, badge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="tourism">Tourism</SelectItem>
                  <SelectItem value="operator_112">112 Operator</SelectItem>
                  <SelectItem value="hotel">Hotel Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.status === 'inactive').length}</div>
                <div className="text-sm text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin' || u.role === 'police').length}</div>
                <div className="text-sm text-muted-foreground">Officers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-info" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.lastLogin && u.lastLogin > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}</div>
                <div className="text-sm text-muted-foreground">Online Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            System Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and system access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users in the system yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((userItem) => (
                <div key={userItem.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userItem.avatar} />
                        <AvatarFallback>
                          {userItem.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{userItem.name}</h4>
                          <Badge className={getStatusColor(userItem.status)}>
                            {getStatusIcon(userItem.status)}
                            <span className="ml-1">{userItem.status}</span>
                          </Badge>
                          <Badge variant="outline" className={getRoleColor(userItem.role)}>
                            {getRoleIcon(userItem.role)}
                            <span className="ml-1">{userItem.role.replace('_', ' ').toUpperCase()}</span>
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {userItem.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {userItem.badge} • {userItem.unit}
                          </div>
                          {userItem.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {userItem.phone}
                            </div>
                          )}
                          {userItem.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {userItem.location}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last login: {userItem.lastLogin ? formatTimeAgo(userItem.lastLogin) : 'Never'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {userItem.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManageUsers && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(value) => handleUpdateUserStatus(userItem.id, value as any)}>
                          <SelectTrigger className="w-24 h-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activate</SelectItem>
                            <SelectItem value="inactive">Deactivate</SelectItem>
                            <SelectItem value="suspended">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(userItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};