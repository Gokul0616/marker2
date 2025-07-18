import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BellIcon, 
  SearchIcon, 
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon
} from 'lucide-react';

const TopHeader = ({ title, rightContent }) => {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-20">
      {/* Left Side - Title */}
      <div className="flex items-center space-x-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* Right Side - User Info and Actions */}
      <div className="flex items-center space-x-4">
        {rightContent}
        
        {/* Search Button */}
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
          <SearchIcon className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 relative">
          <BellIcon className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 border-0">
            2
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
          <SettingsIcon className="h-4 w-4" />
        </Button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {user?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <div className="text-sm font-medium text-gray-900">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500">
              {currentWorkspace?.name || 'Workspace'}
            </div>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-500 hover:text-gray-700"
          onClick={logout}
        >
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopHeader;