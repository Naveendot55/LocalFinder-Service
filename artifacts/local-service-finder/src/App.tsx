import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ServiceList from "@/pages/ServiceList";
import ServiceDetail from "@/pages/ServiceDetail";
import DashboardRedirect from "@/pages/DashboardRedirect";
import UserDashboard from "@/pages/UserDashboard";
import ProviderDashboard from "@/pages/ProviderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NewService from "@/pages/NewService";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/services" component={ServiceList} />
      <Route path="/services/:id" component={ServiceDetail} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      </Route>
      
      <Route path="/user/dashboard">
        <ProtectedRoute allowedRoles={["user", "admin"]}>
          <UserDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/provider/dashboard">
        <ProtectedRoute allowedRoles={["provider", "admin"]}>
          <ProviderDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/provider/services/new">
        <ProtectedRoute allowedRoles={["provider"]}>
          <NewService />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
