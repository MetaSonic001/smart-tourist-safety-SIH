"use client";
import { Dashboard } from "@/components/Dashboard";
import { AuthProvider } from "@/contexts/AuthContext";

export default function DashBoardPage() {
  return (
    <div>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </div>
  );
}
