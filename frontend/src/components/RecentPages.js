import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { 
  FileTextIcon, 
  MoreHorizontalIcon, 
  StarIcon, 
  ShareIcon,
  ClockIcon
} from 'lucide-react';

const RecentPages = ({ pages }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const flattenPages = (pages) => {
    let result = [];
    for (const page of pages) {
      result.push(page);
      if (page.children && page.children.length > 0) {
        result.push(...flattenPages(page.children));
      }
    }
    return result;
  };

  const allPages = flattenPages(pages);
  const recentPages = allPages
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  if (recentPages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileTextIcon className="h-8 w-8 mx-auto mb-2" />
        <p>No pages yet. Create your first page to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recentPages.map((page) => (
        <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-xl">{page.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{page.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <ClockIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(page.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreHorizontalIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Page content preview */}
              <div className="text-sm text-gray-600 line-clamp-2">
                {page.content && page.content.length > 0 
                  ? page.content.find(block => block.content)?.content || 'Empty page'
                  : 'Empty page'
                }
              </div>

              {/* Page metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">
                    {page.createdBy === user.id ? 'You' : 'Someone'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {page.permissions?.public && (
                    <Badge variant="outline" className="text-xs">
                      <ShareIcon className="h-2 w-2 mr-1" />
                      Public
                    </Badge>
                  )}
                  {page.parentId && (
                    <Badge variant="secondary" className="text-xs">
                      Nested
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/page/${page.id}`)}
              >
                Open
              </Button>
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <StarIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <ShareIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecentPages;