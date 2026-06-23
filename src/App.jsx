import "@fontsource/nunito";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import LoginPage from "./pages/LoginPage";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VehiclesPage from "./pages/VehiclesPage";
import DriversPage from "./pages/DriversPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import AssetsPage from "./pages/AssetsPage";
import OperationsLogisticsPage from "./pages/OperationsLogisticsPage";
import CategoriesPage from "./pages/CategoriesPage";
import SettingsPage from "./pages/SettingsPage";
import ExpensePage from "./pages/ExpensePage";
import FinancePage from "./pages/FinancePage";
import RepairsPage from "./pages/RepairsPage";
import MaintenancePage from "./pages/MaintenancePage";
import FuelPage from "./pages/FuelPage";
import TripsPage from "./pages/TripsPage";
// import MasterPage from "./pages/MasterPage";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
        
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/operations-logistics" element={<OperationsLogisticsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/fuel" element={<FuelPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/repairs" element={<RepairsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />       
              {/* <Route path="/master" element={<MasterPage/>}/> */}
            
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
