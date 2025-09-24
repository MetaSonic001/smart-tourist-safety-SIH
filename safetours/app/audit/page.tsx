"use client";
import { AuditLogs } from "@/components/AuditLogs";
import { AuthorityLayout } from "@/components/layout/AuthorityLayout";
import { AuthoritySidebar } from "@/components/layout/AuthoritySidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function TouristDashboardPage() {
  return (
    <div>
      <AuthProvider>
        <AuthorityLayout />
        <AuditLogs />
        <AuthoritySidebar />
      </AuthProvider>
    </div>
  );
}
