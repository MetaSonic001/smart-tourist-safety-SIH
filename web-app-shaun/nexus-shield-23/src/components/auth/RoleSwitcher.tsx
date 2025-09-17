import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserRole, useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  User, 
  MapPin, 
  Phone, 
  Building, 
  Plane,
  RefreshCw 
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ComponentType<any>> = {
  admin: Shield,
  police: Shield,
  tourism: MapPin,
  operator_112: Phone,
  hotel: Building,
  tourist: Plane,
};

const ROLE_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  police: 'Police Officer',
  tourism: 'Tourism Officer',
  operator_112: '112 Operator',
  hotel: 'Hotel Staff',
  tourist: 'Tourist',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access',
  police: 'Law enforcement operations',
  tourism: 'Tourist assistance & monitoring',
  operator_112: 'Emergency response center',
  hotel: 'Hospitality services',
  tourist: 'Limited tourist view',
};

export const RoleSwitcher = () => {
  const { user, switchRole, useMockMode } = useAuth();

  if (!useMockMode || !user) {
    return null;
  }

  const handleRoleSwitch = (role: UserRole) => {
    if (role !== user.role) {
      switchRole(role);
    }
  };

  const CurrentRoleIcon = ROLE_ICONS[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <CurrentRoleIcon className="h-4 w-4" />
          <RefreshCw className="h-3 w-3" />
          Switch Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Demo Role Switcher
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(ROLE_NAMES).map(([role, name]) => {
          const RoleIcon = ROLE_ICONS[role as UserRole];
          const isCurrentRole = user.role === role;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role as UserRole)}
              className={`flex items-center gap-3 ${
                isCurrentRole ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <RoleIcon className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{name}</span>
                  {isCurrentRole && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role as UserRole]}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Demo mode allows instant role switching for testing all features.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};