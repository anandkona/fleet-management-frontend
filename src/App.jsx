import "@fontsource/nunito";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import LoginPage from "./pages/LoginPage";
import FleetApp from "./fleet/FleetApp";

import { SnackbarProvider } from 'notistack';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} autoHideDuration={3000}>
            <NotificationProvider>
              <Routes>
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/:tab" element={<FleetApp />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </NotificationProvider>
          </SnackbarProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
