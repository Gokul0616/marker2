import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  FileTextIcon, 
  DatabaseIcon,
  SettingsIcon,
  SearchIcon,
  HomeIcon,
  BellIcon,
  CalendarIcon,
  TrashIcon,
  MoreHorizontalIcon
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout, switchUser } = useAuth();
  const { currentWorkspace, workspaces, switchWorkspace, getPageTree, createPage } = useWorkspace();
  const { databases, automations } = useNotion();
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const pageTree = getPageTree();

  const togglePageExpansion = (pageId) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const handleCreatePage = () => {
    const newPage = createPage();
    if (newPage) {
      navigate(`/page/${newPage.id}`);
    }
  };

  const renderPageTree = (pages, level = 0) => {
    return pages.map((page) => (
      <div key={page.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => navigate(`/page/${page.id}`)}
        >
          {page.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePageExpansion(page.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedPages.has(page.id) ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </button>
          )}
          <span className="text-sm mr-2">{page.icon || '📄'}</span>
          <span className="text-sm flex-1 truncate">{page.title}</span>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <PlusIcon className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <MoreHorizontalIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {expandedPages.has(page.id) && page.children.length > 0 && (
          <div className="ml-4">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
          onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentWorkspace?.icon || '🏠'}</span>
            <span className="font-medium text-sm">{currentWorkspace?.name || 'Loading...'}</span>
          </div>
          <ChevronDownIcon className="h-4 w-4" />
        </div>
        
        {showWorkspaceDropdown && (
          <div className="absolute left-4 top-16 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-56">
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 mb-1">WORKSPACES</p>
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setShowWorkspaceDropdown(false);
                  }}
                >
                  <span>{workspace.icon}</span>
                  <span className="text-sm">{workspace.name}</span>
                  {workspace.id === currentWorkspace?.id && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="text-xs text-gray-500 mb-1">SWITCH USER (DEMO)</div>
            <div className="space-y-1">
              <div
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => switchUser('user1')}
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <span className="text-sm">John Doe</span>
              </div>
              <div
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => switchUser('user2')}
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b2516509?w=32&h=32&fit=crop&crop=face" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <span className="text-sm">Jane Smith</span>
              </div>
              <div
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => switchUser('user3')}
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <span className="text-sm">Mike Johnson</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-2 space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-left"
          onClick={() => navigate('/')}
        >
          <HomeIcon className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left">
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left">
          <BellIcon className="h-4 w-4 mr-2" />
          Updates
          <Badge variant="secondary" className="ml-auto text-xs">2</Badge>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left" onClick={() => navigate('/settings')}>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left" onClick={() => navigate('/trash')}>
          <TrashIcon className="h-4 w-4 mr-2" />
          Trash
        </Button>
      </div>

      <Separator className="mx-2" />

      {/* Pages Section */}
      <div className="flex-1 overflow-hidden">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">PAGES</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCreatePage}>
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="h-48">
            {renderPageTree(pageTree)}
          </ScrollArea>
        </div>

        {/* Databases Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">DATABASES</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {databases.map((db) => (
              <div
                key={db.id}
                className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => navigate(`/database/${db.id}`)}
              >
                <DatabaseIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm flex-1 truncate">{db.name}</span>
                <span className="text-xs text-gray-500">{db.rows.length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Automations Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">AUTOMATIONS</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {automations.slice(0, 3).map((automation) => (
              <div
                key={automation.id}
                className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
              >
                <div className={`h-2 w-2 rounded-full mr-2 ${automation.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm flex-1 truncate">{automation.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-xs">{user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
          </div>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={logout}>
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;