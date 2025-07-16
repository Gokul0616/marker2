import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import { NotionProvider } from './contexts/NotionContext';
import { Toaster } from 'sonner';
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
    <AuthProvider>
      <WorkspaceProvider>
        <CollaborationProvider>
          <NotionProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/mfa-setup" element={<MFASetupPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/page/:pageId" element={<PageEditor />} />
                  <Route path="/database/:databaseId" element={<DatabaseView />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </NotionProvider>
        </CollaborationProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;