import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers, mockActiveCursors } from '../mock/data';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export const CollaborationProvider = ({ children }) => {
  const [activeCursors, setActiveCursors] = useState(mockActiveCursors);
  const [onlineUsers, setOnlineUsers] = useState(mockUsers);
  const [isConnected, setIsConnected] = useState(true);

  // Mock real-time cursor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCursors(cursors => 
        cursors.map(cursor => ({
          ...cursor,
          position: Math.max(0, cursor.position + (Math.random() - 0.5) * 5),
          timestamp: Date.now()
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const updateCursor = (blockId, position) => {
    const currentUserId = 'user1'; // Mock current user
    setActiveCursors(cursors => {
      const existing = cursors.find(c => c.userId === currentUserId);
      if (existing) {
        return cursors.map(c => 
          c.userId === currentUserId 
            ? { ...c, blockId, position, timestamp: Date.now() }
            : c
        );
      } else {
        return [...cursors, { userId: currentUserId, blockId, position, timestamp: Date.now() }];
      }
    });
  };

  const getCursorsForBlock = (blockId) => {
    return activeCursors
      .filter(cursor => cursor.blockId === blockId)
      .map(cursor => ({
        ...cursor,
        user: mockUsers.find(user => user.id === cursor.userId)
      }));
  };

  const broadcastOperation = (operation) => {
    // Mock broadcasting operation to other users
    console.log('Broadcasting operation:', operation);
  };

  const value = {
    activeCursors,
    onlineUsers,
    isConnected,
    updateCursor,
    getCursorsForBlock,
    broadcastOperation
  };

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
};