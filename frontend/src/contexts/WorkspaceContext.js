import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockWorkspaces, mockPages } from '../mock/data';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(mockWorkspaces[0]);
  const [pages, setPages] = useState(mockPages);
  const [workspaces, setWorkspaces] = useState(mockWorkspaces);

  const switchWorkspace = (workspaceId) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  const createPage = (parentId = null) => {
    const newPage = {
      id: `page_${Date.now()}`,
      title: 'Untitled',
      icon: '📄',
      parentId,
      workspaceId: currentWorkspace.id,
      content: [
        {
          id: `block_${Date.now()}`,
          type: 'paragraph',
          content: '',
          properties: {}
        }
      ],
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: {
        public: false,
        allowComments: true,
        allowEditing: true
      }
    };
    setPages([...pages, newPage]);
    return newPage;
  };

  const updatePage = (pageId, updates) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, ...updates, updatedAt: new Date().toISOString() }
        : page
    ));
  };

  const deletePage = (pageId) => {
    setPages(pages.filter(page => page.id !== pageId && page.parentId !== pageId));
  };

  const getPageTree = () => {
    const buildTree = (parentId = null) => {
      return pages
        .filter(page => page.parentId === parentId && page.workspaceId === currentWorkspace.id)
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
    switchWorkspace,
    createPage,
    updatePage,
    deletePage,
    getPageTree
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};