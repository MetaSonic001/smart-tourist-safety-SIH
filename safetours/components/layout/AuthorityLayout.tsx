import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Bell,
  Globe,
  LogOut,
  Settings,
  User,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthoritySidebar } from "./AuthoritySidebar";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { usePathname } from "next/navigation";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-emergency text-emergency-foreground",
  police: "bg-primary text-primary-foreground",
  tourism: "bg-info text-info-foreground",
  operator_112: "bg-warning text-warning-foreground",
  hotel: "bg-secondary text-secondary-foreground",
  tourist: "bg-muted text-muted-foreground",
};

const ROLE_NAMES: Record<UserRole, string> = {
  admin: "Administrator",
  police: "Police Officer",
  tourism: "Tourism Officer",
  operator_112: "112 Operator",
  hotel: "Hotel Staff",
  tourist: "Tourist",
};

export const AuthorityLayout = () => {
  const { user, logout, useMockMode } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) {
    return null;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Command Dashboard";
    if (path === "/incidents") return "Incident Management";
    if (path === "/heatmap") return "Risk Heatmap";
    if (path === "/digital-ids") return "Digital ID Verification";
    if (path === "/zones") return "Zone Management";
    if (path === "/operator") return "Emergency Console";
    if (path === "/audit") return "Audit Logs";
    return "Authority Portal";
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AuthoritySidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shadow-card">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>

            {useMockMode && (
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/20"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                DEMO MODE
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  EN
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>हिंदी (Hindi)</DropdownMenuItem>
                <DropdownMenuItem>বাংলা (Bengali)</DropdownMenuItem>
                <DropdownMenuItem>தமிழ் (Tamil)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-emergency text-emergency-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Role Switcher - Only in demo mode */}
            {useMockMode && <RoleSwitcher />}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{user.name}</div>
                      <Badge
                        className={`text-xs ${ROLE_COLORS[user.role]}`}
                        variant="secondary"
                      >
                        {ROLE_NAMES[user.role]}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};
