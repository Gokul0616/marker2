import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { trashAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  TrashIcon, 
  RotateCcwIcon, 
  FileTextIcon, 
  DatabaseIcon, 
  AlertTriangleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { toast } from 'sonner';

const TrashPage = () => {
  const { user, loading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [trashItems, setTrashItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    
    if (user && currentWorkspace) {
      loadTrashItems();
    }
  }, [user, loading, navigate, currentWorkspace]);

  const loadTrashItems = async () => {
    try {
      setIsLoading(true);
      const response = await trashAPI.getTrashItems(currentWorkspace.id);
      setTrashItems(response.items || []);
    } catch (error) {
      console.error('Error loading trash items:', error);
      toast.error('Failed to load trash items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (itemId, itemType) => {
    try {
      await trashAPI.restoreItem(itemId, itemType);
      toast.success('Item restored successfully');
      loadTrashItems(); // Refresh the list
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = async (itemId, itemType) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await trashAPI.permanentlyDeleteItem(itemId, itemType);
      toast.success('Item permanently deleted');
      loadTrashItems(); // Refresh the list
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast.error('Failed to permanently delete item');
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to empty the trash? This will permanently delete all items and cannot be undone.')) {
      return;
    }

    try {
      await trashAPI.emptyTrash(currentWorkspace.id);
      toast.success('Trash emptied successfully');
      loadTrashItems(); // Refresh the list
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
    }
  };

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

  const getItemIcon = (type) => {
    switch (type) {
      case 'page':
        return <FileTextIcon className="h-5 w-5 text-blue-500" />;
      case 'database':
        return <DatabaseIcon className="h-5 w-5 text-green-500" />;
      default:
        return <FileTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <TrashIcon className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
              <Badge variant="secondary" className="text-xs">
                {trashItems.length} items
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadTrashItems}
                disabled={isLoading}
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {trashItems.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleEmptyTrash}
                >
                  <AlertTriangleIcon className="h-4 w-4 mr-2" />
                  Empty Trash
                </Button>
              )}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trash items...</p>
              </div>
            </div>
          ) : trashItems.length === 0 ? (
            <div className="text-center py-16">
              <TrashIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Trash is empty</h2>
              <p className="text-gray-600">
                Deleted pages and databases will appear here. You can restore them or permanently delete them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Deleted Items ({trashItems.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Items will be permanently deleted after 30 days
                </div>
              </div>
              
              <div className="grid gap-4">
                {trashItems.map((item) => (
                  <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getItemIcon(item.type)}
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title || item.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className="capitalize">{item.type}</span>
                              <span>•</span>
                              <span>Deleted {formatDate(item.deleted_at)}</span>
                              {item.deleted_by_name && (
                                <>
                                  <span>•</span>
                                  <span>by {item.deleted_by_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(item.id, item.type)}
                          >
                            <RotateCcwIcon className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete(item.id, item.type)}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TrashPage;