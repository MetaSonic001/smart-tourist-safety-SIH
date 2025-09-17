import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'emergency' | 'incident' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationCenterProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS = {
  emergency: AlertTriangle,
  incident: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const NOTIFICATION_COLORS = {
  emergency: 'text-emergency bg-emergency/10 border-emergency/20',
  incident: 'text-warning bg-warning/10 border-warning/20',
  info: 'text-info bg-info/10 border-info/20',
  success: 'text-success bg-success/10 border-success/20',
};

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'emergency',
    title: 'Emergency SOS Alert',
    message: 'Tourist in distress at Connaught Place. Immediate response required.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    type: 'incident',
    title: 'New Incident Reported',
    message: 'Theft reported near India Gate. Assigned to Officer Chen.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'info',
    title: 'Zone Risk Updated',
    message: 'Karol Bagh risk level increased to Medium due to crowding.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: true,
    priority: 'low',
  },
  {
    id: '4',
    type: 'success',
    title: 'Digital ID Verified',
    message: 'Tourist digital ID DID-12345 successfully verified.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    read: true,
    priority: 'low',
  },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l shadow-elevated z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-emergency text-emergency-foreground">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-full pb-16">
        <div className="space-y-1 p-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            
            return (
              <div
                key={notification.id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50',
                  notification.read 
                    ? 'bg-background border-border opacity-75' 
                    : 'bg-accent/20 border-accent'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-full flex-shrink-0',
                    NOTIFICATION_COLORS[notification.type]
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium truncate">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {notification.priority === 'high' && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs bg-emergency/10 text-emergency border-emergency/20"
                      >
                        High Priority
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};