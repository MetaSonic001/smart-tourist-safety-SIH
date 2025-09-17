import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Shield,
  MapPin,
  AlertTriangle,
  Users,
  Settings,
  FileText,
  Phone,
  Map,
  IdCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, hasPermission } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: string;
  roles?: string[];
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    permission: 'dashboard.view',
  },
  {
    title: 'Tourist Management',
    href: '/tourist-dashboard',
    icon: UserCheck,
    permission: 'tourists.manage',
  },
  {
    title: 'Incidents',
    href: '/incidents',
    icon: AlertTriangle,
    permission: 'incidents.read',
  },
  {
    title: 'Risk Heatmap',
    href: '/heatmap',
    icon: Map,
    permission: 'zones.read',
  },
  {
    title: 'Digital IDs',
    href: '/digital-ids',
    icon: IdCard,
    permission: 'digital_id.verify',
  },
  {
    title: 'Emergency Console',
    href: '/operator',
    icon: Phone,
    roles: ['operator_112'],
    badge: 'LIVE',
  },
  {
    title: 'Zone Management',
    href: '/zones',
    icon: MapPin,
    permission: 'zones.manage',
    roles: ['admin', 'police'],
  },
  {
    title: 'User Management',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Audit Logs',
    href: '/audit',
    icon: FileText,
    permission: 'audit.read',
    roles: ['admin', 'police'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const AuthoritySidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isNavItemVisible = (item: NavItem) => {
    if (item.roles && !item.roles.includes(user?.role || '')) {
      return false;
    }
    if (item.permission && !hasPermission(user, item.permission)) {
      return false;
    }
    return true;
  };

  const getNavItemClassName = (href: string) => {
    const isActive = location.pathname === href;
    return cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    );
  };

  return (
    <div className={cn(
      'flex h-screen flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo and Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold">Authority Portal</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.badge} • {user.unit || 'Authority Portal'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems
          .filter(isNavItemVisible)
          .map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={getNavItemClassName(item.href)}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-emergency text-emergency-foreground rounded-full emergency-pulse">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="status-indicator status-online"></div>
            <span className="text-muted-foreground">System Online</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Activity className="h-3 w-3" />
            <span>Last sync: 2 minutes ago</span>
          </div>
        </div>
      )}
    </div>
  );
};