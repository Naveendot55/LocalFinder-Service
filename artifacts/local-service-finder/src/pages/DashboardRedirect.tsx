import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { Layout } from "@/components/layout/Layout";

export default function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLocation("/login");
      return;
    }

    if (user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (user.role === "provider") {
      setLocation("/provider/dashboard");
    } else {
      setLocation("/user/dashboard");
    }
  }, [user, isAuthenticated, setLocation]);

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Spinner className="h-8 w-8" />
      </div>
    </Layout>
  );
}
