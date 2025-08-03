import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../contexts/AuthContext';
import { ZoomProvider, useZoomContext } from '../contexts/ZoomContext';
import Sidebar from '../components/Sidebar';
import BlockEditor from '../components/BlockEditor';
import PageHeader from '../components/PageHeader';
import CommentsPanel from '../components/CommentsPanel';
import CollaborationPanel from '../components/CollaborationPanel';
import ZoomControls from '../components/ZoomControls';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { 
  MessageSquareIcon, 
  ShareIcon, 
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  LockIcon,
  SaveIcon,
  AlertCircleIcon
} from 'lucide-react';

const PageEditorContent = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { pages, updatePage } = useWorkspace();
  const { comments, addComment } = useNotion();
  const { onlineUsers, getCursorsForBlock } = useCollaboration();
  const {
    zoom,
    viewportOffset,
    isDragging,
    containerRef,
    contentRef,
    transformStyle,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleZoomChange,
  } = useZoomContext();
  
  const [showComments, setShowComments] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const page = pages.find(p => p.id === pageId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (!authLoading && !page) {
      toast.error('Page not found');
      navigate('/dashboard');
    }
  }, [page, user, authLoading, navigate]);

  // Auto-save functionality
  useEffect(() => {
    if (unsavedChanges && !saving) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [unsavedChanges, saving]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (!page) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
          <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdatePage = async (updates) => {
    try {
      setSaving(true);
      setUnsavedChanges(true);
      
      updatePage(pageId, updates);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLastSaved(new Date());
      setUnsavedChanges(false);
      toast.success('Page saved successfully');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!unsavedChanges) return;
    
    try {
      setSaving(true);
      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
      setUnsavedChanges(false);
      toast.success('Page saved');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Page link copied to clipboard');
  };

  const pageComments = comments.filter(c => 
    page.content.some(block => block.id === c.blockId)
  );

  // Production-grade permission system
  const canEdit = user && page.permissions?.allowEditing;
  const canComment = user && page.permissions?.allowComments;
  const isOwner = user && page.createdBy === user.id;
  const canDelete = isOwner || (user && user.role === 'owner');

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-white">
        <Sidebar />
        
        <div className="flex-1 flex flex-col ml-64">
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
                  
                  {/* Save Status */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {saving && (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Saving...</span>
                      </div>
                    )}
                    {!saving && unsavedChanges && (
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <span>Unsaved changes</span>
                      </div>
                    )}
                    {!saving && !unsavedChanges && lastSaved && (
                      <span>
                        Saved {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Online Users */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                  </span>
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 3).map((user) => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {onlineUsers.length > 3 && (
                      <div className="h-6 w-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{onlineUsers.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={!unsavedChanges || saving}
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                )}
                
                {canComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageSquareIcon className="h-4 w-4 mr-2" />
                    Comments
                    {pageComments.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {pageComments.length}
                      </Badge>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                <CollaborationPanel />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div 
            ref={containerRef}
            className="flex-1 flex overflow-hidden relative bg-gray-50"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: isDragging ? 'none' : 'auto'
            }}
          >
            {/* Zoomable Content Container */}
            <div
              ref={contentRef}
              style={transformStyle}
              className="flex w-full min-h-full"
            >
              {/* Editor */}
              <div className="flex-1 bg-white shadow-sm">
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
            </div>

            {/* Comments Panel - Outside of zoom container */}
            {showComments && (
              <div className="w-80 border-l border-gray-200 bg-white relative z-10">
                <CommentsPanel 
                  comments={pageComments}
                  onAddComment={addComment}
                  pageContent={page.content}
                />
              </div>
            )}

            {/* Zoom Controls */}
            <ZoomControls
              zoom={zoom}
              onZoomChange={handleZoomChange}
              onFitToScreen={fitToScreen}
              onResetZoom={resetZoom}
              position="bottom-left"
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PageEditor;