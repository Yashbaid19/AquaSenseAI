import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';
import { initializeWebSocket } from './websocket';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import IrrigationPage from './pages/IrrigationPage';
import FarmZonesPage from './pages/FarmZonesPage';
import DroneMonitoringPage from './pages/DroneMonitoringPage';
import RoverMonitoringPage from './pages/RoverMonitoringPage';
import WaterAnalyticsPage from './pages/WaterAnalyticsPage';
import AIChatPage from './pages/AIChatPage';
import SettingsPage from './pages/SettingsPage';
import AdvancedAnalyticsPage from './pages/AdvancedAnalyticsPage';

// Layout
import DashboardLayout from './components/DashboardLayout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  useEffect(() => {
    if (token && user.id) {
      initializeWebSocket(user.id);
    }
  }, [token, user.id]);
  
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="irrigation" element={<IrrigationPage />} />
            <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="zones" element={<FarmZonesPage />} />
            <Route path="drone" element={<DroneMonitoringPage />} />
            <Route path="rover" element={<RoverMonitoringPage />} />
            <Route path="analytics" element={<WaterAnalyticsPage />} />
            <Route path="chat" element={<AIChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;