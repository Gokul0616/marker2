import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDatabases, mockTemplates, mockAutomations, mockComments } from '../mock/data';

const NotionContext = createContext();

export const useNotion = () => {
  const context = useContext(NotionContext);
  if (!context) {
    throw new Error('useNotion must be used within a NotionProvider');
  }
  return context;
};

export const NotionProvider = ({ children }) => {
  const [databases, setDatabases] = useState(mockDatabases);
  const [templates, setTemplates] = useState(mockTemplates);
  const [automations, setAutomations] = useState(mockAutomations);
  const [comments, setComments] = useState(mockComments);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Mock search functionality
  useEffect(() => {
    if (searchQuery.length > 0) {
      // Mock search results from pages, databases, etc.
      const results = [
        { id: 'page1', title: 'Getting Started', type: 'page', icon: '📝' },
        { id: 'db1', title: 'Tasks Database', type: 'database', icon: '📊' }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const executeFormula = (formula, rowData) => {
    // Mock formula execution
    try {
      // Simple formula parser for demo
      if (formula.includes('dateBetween')) {
        const match = formula.match(/dateBetween\(prop\("([^"]+)"\), now\(\), "([^"]+)"\)/);
        if (match) {
          const [, propName, unit] = match;
          const date = new Date(rowData[propName]);
          const now = new Date();
          const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
          return unit === 'days' ? diff : diff;
        }
      }
      return 0;
    } catch (error) {
      return 'Error';
    }
  };

  const createDatabase = (name, properties = {}) => {
    const newDb = {
      id: `db_${Date.now()}`,
      name,
      properties: {
        title: {
          id: 'title',
          name: 'Name',
          type: 'title'
        },
        ...properties
      },
      rows: [],
      views: [
        {
          id: `view_${Date.now()}`,
          name: 'Table',
          type: 'table',
          isDefault: true,
          filter: {},
          sort: []
        }
      ]
    };
    setDatabases([...databases, newDb]);
    return newDb;
  };

  const updateDatabase = (databaseId, updates) => {
    setDatabases(databases.map(db => 
      db.id === databaseId ? { ...db, ...updates } : db
    ));
  };

  const addDatabaseRow = (databaseId, properties) => {
    const newRow = {
      id: `row_${Date.now()}`,
      properties
    };
    
    setDatabases(databases.map(db => 
      db.id === databaseId 
        ? { ...db, rows: [...db.rows, newRow] }
        : db
    ));
    return newRow;
  };

  const updateDatabaseRow = (databaseId, rowId, properties) => {
    setDatabases(databases.map(db => 
      db.id === databaseId 
        ? {
            ...db,
            rows: db.rows.map(row => 
              row.id === rowId 
                ? { ...row, properties: { ...row.properties, ...properties } }
                : row
            )
          }
        : db
    ));
  };

  const addComment = (blockId, content, userId) => {
    const newComment = {
      id: `comment_${Date.now()}`,
      blockId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: []
    };
    setComments([...comments, newComment]);
    return newComment;
  };

  const createAutomation = (name, trigger, actions) => {
    const newAutomation = {
      id: `automation_${Date.now()}`,
      name,
      description: '',
      trigger,
      actions,
      isActive: true
    };
    setAutomations([...automations, newAutomation]);
    return newAutomation;
  };

  const toggleAutomation = (automationId) => {
    setAutomations(automations.map(auto => 
      auto.id === automationId 
        ? { ...auto, isActive: !auto.isActive }
        : auto
    ));
  };

  const value = {
    databases,
    templates,
    automations,
    comments,
    searchQuery,
    searchResults,
    setSearchQuery,
    executeFormula,
    createDatabase,
    updateDatabase,
    addDatabaseRow,
    updateDatabaseRow,
    addComment,
    createAutomation,
    toggleAutomation
  };

  return <NotionContext.Provider value={value}>{children}</NotionContext.Provider>;
};