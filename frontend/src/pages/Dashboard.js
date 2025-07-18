import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import SearchBar from '../components/SearchBar';
import TemplateGallery from '../components/TemplateGallery';
import RecentPages from '../components/RecentPages';
import QuickActions from '../components/QuickActions';
import CollaborationPanel from '../components/CollaborationPanel';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { PlusIcon, DatabaseIcon, FileTextIcon, SettingsIcon } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, loading } = useAuth();
  const { currentWorkspace, getPageTree, createPage } = useWorkspace();
  const { databases, searchResults } = useNotion();
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreatePage = () => {
    const newPage = createPage();
    navigate(`/page/${newPage.id}`);
  };

  const handleCreateDatabase = () => {
    // Navigate to database creation
    navigate('/database/new');
  };

  const pageTree = getPageTree();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header with User Info */}
        <TopHeader 
          title={`${currentWorkspace?.icon || '🏠'} ${currentWorkspace?.name || 'Workspace'}`}
          rightContent={
            <div className="flex items-center space-x-4">
              <SearchBar />
              <CollaborationPanel />
              <Badge variant="secondary" className="text-xs">
                {currentWorkspace?.settings?.permissions || 'private'}
              </Badge>
            </div>
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 mt-14">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Search Results</h2>
              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{result.icon}</span>
                        <div>
                          <h3 className="font-medium">{result.title}</h3>
                          <p className="text-sm text-gray-600 capitalize">{result.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Welcome Message */}
              <section>
                <div className="text-center py-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.name || 'User'}! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Ready to organize your thoughts and ideas in MindNotes?
                  </p>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreatePage}>
                    <CardContent className="p-6 text-center">
                      <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <h3 className="font-medium mb-1">Create Page</h3>
                      <p className="text-sm text-gray-600">Start with a blank page</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateDatabase}>
                    <CardContent className="p-6 text-center">
                      <DatabaseIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <h3 className="font-medium mb-1">Create Database</h3>
                      <p className="text-sm text-gray-600">Organize with tables</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowTemplates(!showTemplates)}>
                    <CardContent className="p-6 text-center">
                      <PlusIcon className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <h3 className="font-medium mb-1">Use Template</h3>
                      <p className="text-sm text-gray-600">Start with a template</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Templates */}
              {showTemplates && (
                <section>
                  <TemplateGallery />
                </section>
              )}

              {/* Recent Pages */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Recent Pages</h2>
                <RecentPages pages={pageTree} />
              </section>

              {/* Databases */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Databases</h2>
                <div className="grid gap-4">
                  {databases.map((db) => (
                    <Card key={db.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/database/${db.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DatabaseIcon className="h-5 w-5 text-gray-500" />
                            <div>
                              <h3 className="font-medium">{db.name}</h3>
                              <p className="text-sm text-gray-600">{db.rows.length} rows</p>
                            </div>
                          </div>
                          <Badge variant="outline">{db.views.length} views</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;