import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import BlockEditor from '../components/BlockEditor';
import PageHeader from '../components/PageHeader';
import CommentsPanel from '../components/CommentsPanel';
import CollaborationPanel from '../components/CollaborationPanel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  MessageSquareIcon, 
  ShareIcon, 
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  LockIcon
} from 'lucide-react';

const PageEditor = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pages, updatePage } = useWorkspace();
  const { comments, addComment } = useNotion();
  const { onlineUsers, getCursorsForBlock } = useCollaboration();
  const [showComments, setShowComments] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [isEditing, setIsEditing] = useState(true);

  const page = pages.find(p => p.id === pageId);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!page) {
      navigate('/dashboard');
    }
  }, [page, user, navigate]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return <div>Page not found</div>;
  }

  const handleUpdatePage = (updates) => {
    updatePage(pageId, updates);
  };

  const handleUpdateContent = (newContent) => {
    handleUpdatePage({ content: newContent });
  };

  const handleTitleChange = (title) => {
    handleUpdatePage({ title });
  };

  const handleIconChange = (icon) => {
    handleUpdatePage({ icon });
  };

  const pageComments = comments.filter(c => 
    page.content.some(block => block.id === c.blockId)
  );

  const canEdit = page.permissions?.allowEditing && user;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        <PageHeader 
          page={page}
          onTitleChange={handleTitleChange}
          onIconChange={handleIconChange}
          canEdit={canEdit}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />

        {/* Collaboration Bar */}
        <div className="border-b border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant={isEditing ? "default" : "secondary"} className="text-xs">
                  {isEditing ? (
                    <>
                      <EditIcon className="h-3 w-3 mr-1" />
                      Editing
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Viewing
                    </>
                  )}
                </Badge>
                {!canEdit && (
                  <Badge variant="outline" className="text-xs">
                    <LockIcon className="h-3 w-3 mr-1" />
                    Read-only
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Last edited {new Date(page.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquareIcon className="h-4 w-4 mr-1" />
                Comments
                {pageComments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pageComments.length}
                  </Badge>
                )}
              </Button>
              <CollaborationPanel />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Editor */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <BlockEditor 
                content={page.content}
                onChange={handleUpdateContent}
                canEdit={canEdit && isEditing}
                pageId={pageId}
                selectedBlocks={selectedBlocks}
                setSelectedBlocks={setSelectedBlocks}
              />
            </div>
          </div>

          {/* Comments Panel */}
          {showComments && (
            <div className="w-80 border-l border-gray-200">
              <CommentsPanel 
                comments={pageComments}
                onAddComment={addComment}
                pageContent={page.content}
              />
            </div>
          )}
        </div>

        {/* Real-time Cursors Indicator */}
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center space-x-2">
            {onlineUsers.filter(u => u.id !== user.id).map(u => (
              <div key={u.id} className="flex items-center space-x-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                <div 
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                <Avatar className="h-4 w-4">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback className="text-xs">{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{u.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageEditor;