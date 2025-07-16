import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import { NotionProvider } from './contexts/NotionContext';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
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
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<Dashboard />} />
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