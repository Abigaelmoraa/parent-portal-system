import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Results from "./pages/Results";
import Attendance from "./pages/Attendance";
import Financials from "./pages/Financials";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminResults from './pages/admin/AdminResults';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminParents from './pages/admin/AdminParents';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            
            {/* Admin routes with AdminLayout */}
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminStudents />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/results" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminResults />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminAttendance />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/financials" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminFinancials />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/parents" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminParents />
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            {/* Redirect /admin to /admin/dashboard */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Parent routes with Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <Layout>
                  <Results />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/financials" element={
              <ProtectedRoute>
                <Layout>
                  <Financials />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
