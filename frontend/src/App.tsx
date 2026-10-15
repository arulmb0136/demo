import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { ContractDetail } from './pages/ContractDetail';
import { AdminRoles } from './pages/AdminRoles';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contracts/:id"
                    element={
                      <ProtectedRoute>
                        <ContractDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/roles"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminRoles />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
