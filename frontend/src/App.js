import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import { NotionProvider } from './contexts/NotionContext';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MFASetupPage from './pages/MFASetupPage';
import Dashboard from './pages/Dashboard';
import PageEditor from './pages/PageEditor';
import DatabaseView from './pages/DatabaseView';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkspaceProvider>
          <CollaborationProvider>
            <NotionProvider>
              <Router>
                <div className="App">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/page/:pageId"
                      element={
                        <ProtectedRoute>
                          <PageEditor />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/database/:databaseId"
                      element={
                        <ProtectedRoute>
                          <DatabaseView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mfa-setup"
                      element={
                        <ProtectedRoute>
                          <MFASetupPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  
                  {/* Global Toast Notifications */}
                  <Toaster 
                    position="top-right"
                    richColors
                    closeButton
                    duration={4000}
                  />
                </div>
              </Router>
            </NotionProvider>
          </CollaborationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;