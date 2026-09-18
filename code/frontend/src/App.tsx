import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import VehicleManagement from "./pages/admin/VehicleManagement";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import RoutesPage from "./pages/Routes";
import TrackingPage from "./pages/parent/TrackingPage";
import DriverDashboard from "./pages/driver/DriverDashboard";
import AttendancePage from "./pages/driver/AttendancePage";
import AnnouncementPage from "./pages/driver/AnnouncementPage";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildManagement from "./pages/parent/ChildManagement";
import ParentHistory from "./pages/parent/ParentHistory";
import ParentPaymentDashboard from "./pages/parent/ParentPaymentDashboard";
import DriverOnboarding from "./pages/driver/DriverOnboarding";
import PaymentSettingsPage from "./pages/driver/PaymentSettingsPage";
import StudentPaymentDashboard from "./pages/driver/StudentPaymentDashboard";
import DriverPaymentHistoryPage from "./pages/driver/DriverPaymentHistoryPage";
import SidebarLayout from "./components/SidebarLayout";
import { AuthProvider } from "./features/auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/account/ProfilePage";
import SettingsPage from "./pages/account/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* auth login page (no sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* admin login page */}
          <Route path="/admin" element={<AdminLoginPage />} />

          {/* pages wrapped in sidebar layout */}
          <Route element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }>
            {/* default redirect handled by ProtectedRoute, but keep a fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* admin dashboard */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* admin management pages */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/vehicles" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <VehicleManagement />
              </ProtectedRoute>
            } />
            
            {/* route management page */}
            <Route path="/routes" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <RoutesPage />
              </ProtectedRoute>
            } />
            
            {/* parent pages */}
            <Route path="/parent" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent/children" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ChildManagement />
              </ProtectedRoute>
            } />
            <Route path="/parent/history" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentHistory />
              </ProtectedRoute>
            } />
            <Route path="/parent/payments" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentPaymentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/tracking" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <TrackingPage />
              </ProtectedRoute>
            } />
            
            {/* driver pages */}
            <Route path="/driver" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver/attendance" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <AttendancePage />
              </ProtectedRoute>
            } />
            <Route path="/driver/announce" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <AnnouncementPage />
              </ProtectedRoute>
            } />
            <Route path="/driver/onboarding" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/driver/payments" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <StudentPaymentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver/payments/history" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverPaymentHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/driver/payments/settings" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <PaymentSettingsPage />
              </ProtectedRoute>
            } />
          </Route>


          {/* catch-all fallback to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
