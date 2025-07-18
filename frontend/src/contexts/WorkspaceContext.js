import React, { createContext, useContext, useState, useEffect } from 'react';
import { workspacesAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [pages, setPages] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load workspaces on auth change
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setPages([]);
      setLoading(false);
    }
  }, [user]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const userWorkspaces = await workspacesAPI.getWorkspaces();
      setWorkspaces(userWorkspaces);
      
      // Set the first workspace as current if none is selected
      if (!currentWorkspace && userWorkspaces.length > 0) {
        setCurrentWorkspace(userWorkspaces[0]);
      } else if (userWorkspaces.length === 0) {
        // Create a default workspace if none exists
        const defaultWorkspace = await createDefaultWorkspace();
        if (defaultWorkspace) {
          setWorkspaces([defaultWorkspace]);
          setCurrentWorkspace(defaultWorkspace);
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWorkspace = async () => {
    try {
      const defaultWorkspaceData = {
        name: 'My Workspace',
        icon: '🏠',
        settings: {
          theme: 'light',
          language: 'en'
        }
      };
      
      const newWorkspace = await workspacesAPI.createWorkspace(defaultWorkspaceData);
      return newWorkspace;
    } catch (error) {
      console.error('Error creating default workspace:', error);
      return null;
    }
  };

  const updateWorkspace = async (workspaceId, updateData) => {
    try {
      const updatedWorkspace = await workspacesAPI.updateWorkspace(workspaceId, updateData);
      
      // Update in workspaces list
      setWorkspaces(prev => prev.map(ws => 
        ws.id === workspaceId ? { ...ws, ...updatedWorkspace } : ws
      ));
      
      // Update current workspace if it's the one being updated
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(prev => ({ ...prev, ...updatedWorkspace }));
      }
      
      return updatedWorkspace;
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  };

  const switchWorkspace = (workspaceId) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  const createPage = (parentId = null) => {
    if (!currentWorkspace) {
      console.error('Cannot create page: No current workspace available');
      return null;
    }

    if (!user) {
      console.error('Cannot create page: No user available');
      return null;
    }
    
    const newPage = {
      id: `page_${Date.now()}`,
      title: 'Untitled',
      icon: '📄',
      parent_id: parentId,
      workspace_id: currentWorkspace.id,
      content: [
        {
          id: `block_${Date.now()}`,
          type: 'paragraph',
          content: '',
          properties: {}
        }
      ],
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      permissions: {
        public: false,
        allowComments: true,
        allowEditing: true
      }
    };
    
    setPages(prev => [...prev, newPage]);
    return newPage;
  };

  const updatePage = (pageId, updates) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, ...updates, updated_at: new Date().toISOString() }
        : page
    ));
  };

  const deletePage = (pageId) => {
    setPages(pages.filter(page => page.id !== pageId && page.parent_id !== pageId));
  };

  const getPageTree = () => {
    const buildTree = (parentId = null) => {
      return pages
        .filter(page => page.parent_id === parentId)
        .map(page => ({
          ...page,
          children: buildTree(page.id)
        }));
    };
    
    return buildTree();
  };

  const value = {
    currentWorkspace,
    workspaces,
    pages,
    loading,
    switchWorkspace,
    updateWorkspace,
    createPage,
    updatePage,
    deletePage,
    getPageTree,
    loadWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};