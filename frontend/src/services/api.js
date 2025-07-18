import axios from 'axios';

// Get backend URL from environment
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://fe1fb5e6-012a-408a-8ba0-34abb1e33e6b.preview.emergentagent.com';

// Ensure HTTPS protocol
const HTTPS_API_BASE_URL = API_BASE_URL.replace(/^http:/, 'https:');

// Debug log
console.log('API_BASE_URL:', API_BASE_URL);
console.log('HTTPS_API_BASE_URL:', HTTPS_API_BASE_URL);
console.log('Full baseURL:', `${HTTPS_API_BASE_URL}/api`);

// Create axios instance
const api = axios.create({
  baseURL: `${HTTPS_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and ensure HTTPS
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure all URLs use HTTPS
    if (config.url && config.url.startsWith('http:')) {
      config.url = config.url.replace(/^http:/, 'https:');
    }
    if (config.baseURL && config.baseURL.startsWith('http:')) {
      config.baseURL = config.baseURL.replace(/^http:/, 'https:');
    }
    
    console.log('Request URL:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  verifyMFA: async (userId, backupCode) => {
    const response = await api.post('/auth/verify-mfa', 
      { backup_code: backupCode }, 
      { params: { user_id: userId } }
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  enableMFA: async () => {
    const response = await api.post('/auth/enable-mfa');
    return response.data;
  },

  disableMFA: async () => {
    const response = await api.post('/auth/disable-mfa');
    return response.data;
  },

  regenerateBackupCodes: async () => {
    const response = await api.post('/auth/regenerate-backup-codes');
    return response.data;
  },

  getRateLimitStatus: async () => {
    const response = await api.get('/auth/rate-limit-status');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (skip = 0, limit = 100) => {
    const response = await api.get(`/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateCurrentUser: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/me/change-password', passwordData);
    return response.data;
  },

  deactivateAccount: async () => {
    const response = await api.delete('/users/me');
    return response.data;
  },
};

// Workspaces API
export const workspacesAPI = {
  getWorkspaces: async () => {
    const response = await api.get('/workspaces/');
    return response.data;
  },

  getWorkspace: async (workspaceId) => {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data;
  },

  createWorkspace: async (workspaceData) => {
    const response = await api.post('/workspaces', workspaceData);
    return response.data;
  },

  updateWorkspace: async (workspaceId, workspaceData) => {
    const response = await api.put(`/workspaces/${workspaceId}`, workspaceData);
    return response.data;
  },

  deleteWorkspace: async (workspaceId) => {
    const response = await api.delete(`/workspaces/${workspaceId}`);
    return response.data;
  },

  addMember: async (workspaceId, userId) => {
    const response = await api.post(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },

  removeMember: async (workspaceId, userId) => {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },
};

// Pages API
export const pagesAPI = {
  getPages: async (workspaceId = null, parentId = null) => {
    let url = '/pages/';
    const params = new URLSearchParams();
    
    if (workspaceId) params.append('workspace_id', workspaceId);
    if (parentId) params.append('parent_id', parentId);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await api.get(url);
    return response.data;
  },

  getPage: async (pageId) => {
    const response = await api.get(`/pages/${pageId}`);
    return response.data;
  },

  createPage: async (pageData) => {
    const response = await api.post('/pages/', pageData);
    return response.data;
  },

  updatePage: async (pageId, pageData) => {
    const response = await api.put(`/pages/${pageId}`, pageData);
    return response.data;
  },

  deletePage: async (pageId) => {
    const response = await api.delete(`/pages/${pageId}`);
    return response.data;
  },

  grantPermission: async (pageId, userId, permission) => {
    const response = await api.post(`/pages/${pageId}/permissions/${userId}?permission=${permission}`);
    return response.data;
  },

  revokePermission: async (pageId, userId) => {
    const response = await api.delete(`/pages/${pageId}/permissions/${userId}`);
    return response.data;
  },
};

// Databases API
export const databasesAPI = {
  getDatabases: async (workspaceId = null) => {
    let url = '/databases/';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  getDatabase: async (databaseId) => {
    const response = await api.get(`/databases/${databaseId}`);
    return response.data;
  },

  createDatabase: async (databaseData) => {
    const response = await api.post('/databases', databaseData);
    return response.data;
  },

  updateDatabase: async (databaseId, databaseData) => {
    const response = await api.put(`/databases/${databaseId}`, databaseData);
    return response.data;
  },

  deleteDatabase: async (databaseId) => {
    const response = await api.delete(`/databases/${databaseId}`);
    return response.data;
  },

  // Database rows
  getDatabaseRows: async (databaseId) => {
    const response = await api.get(`/databases/${databaseId}/rows`);
    return response.data;
  },

  createDatabaseRow: async (databaseId, rowData) => {
    const response = await api.post(`/databases/${databaseId}/rows`, {
      database_id: databaseId,
      properties: rowData
    });
    return response.data;
  },

  updateDatabaseRow: async (databaseId, rowId, rowData) => {
    const response = await api.put(`/databases/${databaseId}/rows/${rowId}`, {
      properties: rowData
    });
    return response.data;
  },

  deleteDatabaseRow: async (databaseId, rowId) => {
    const response = await api.delete(`/databases/${databaseId}/rows/${rowId}`);
    return response.data;
  },
};

// Trash API
export const trashAPI = {
  getTrashItems: async (workspaceId = null) => {
    let url = '/trash';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  restoreItem: async (itemId, itemType) => {
    const response = await api.post(`/trash/${itemId}/restore?item_type=${itemType}`);
    return response.data;
  },

  permanentlyDeleteItem: async (itemId, itemType) => {
    const response = await api.delete(`/trash/${itemId}?item_type=${itemType}`);
    return response.data;
  },

  emptyTrash: async (workspaceId = null) => {
    let url = '/trash/empty';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    
    const response = await api.post(url);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;