import React, { useState } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { 
  UsersIcon, 
  ShareIcon, 
  LockIcon, 
  UnlockIcon,
  WifiIcon,
  WifiOffIcon
} from 'lucide-react';

const CollaborationPanel = () => {
  const { onlineUsers, isConnected } = useCollaboration();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const otherUsers = onlineUsers.filter(u => u.id !== user.id);

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <WifiIcon className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOffIcon className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs text-gray-500">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Online Users */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-1">
                {otherUsers.slice(0, 3).map((u) => (
                  <Avatar key={u.id} className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {otherUsers.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{otherUsers.length - 3}
                </Badge>
              )}
              <UsersIcon className="h-4 w-4 ml-1" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Collaboration</h3>
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Online Now ({onlineUsers.length})</h4>
              <div className="space-y-2">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{u.name}</span>
                        {u.id === user.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="capitalize">{u.role}</span>
                        <div 
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: u.color }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Share & Permissions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share to web
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <LockIcon className="h-4 w-4 mr-2" />
                  Manage permissions
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Real-time Features</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Live cursors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Collaborative editing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Real-time comments</span>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Share Button */}
      <Button variant="outline" size="sm">
        <ShareIcon className="h-4 w-4 mr-1" />
        Share
      </Button>
    </div>
  );
};

export default CollaborationPanel;