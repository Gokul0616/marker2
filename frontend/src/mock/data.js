// Mock data for MindNotes
export const mockUsers = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    role: 'owner',
    color: '#3b82f6'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2516509?w=32&h=32&fit=crop&crop=face',
    role: 'editor',
    color: '#10b981'
  },
  {
    id: 'user3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    role: 'viewer',
    color: '#f59e0b'
  }
];

export const mockWorkspaces = [
  {
    id: 'workspace1',
    name: 'Personal',
    icon: '👤',
    members: ['user1'],
    settings: {
      permissions: 'private',
      allowGuests: false
    }
  },
  {
    id: 'workspace2',
    name: 'Team Alpha',
    icon: '🚀',
    members: ['user1', 'user2', 'user3'],
    settings: {
      permissions: 'team',
      allowGuests: true
    }
  }
];

export const mockPages = [
  {
    id: 'page1',
    title: 'Getting Started',
    icon: '📝',
    parentId: null,
    workspaceId: 'workspace1',
    content: [
      {
        id: 'block1',
        type: 'heading1',
        content: 'Welcome to Your Notion Clone',
        properties: {}
      },
      {
        id: 'block2',
        type: 'paragraph',
        content: 'This is a comprehensive Notion clone with all the features you love.',
        properties: {}
      },
      {
        id: 'block3',
        type: 'bulleted_list',
        content: 'Rich text editing with blocks',
        properties: {}
      },
      {
        id: 'block4',
        type: 'bulleted_list',
        content: 'Real-time collaboration',
        properties: {}
      },
      {
        id: 'block5',
        type: 'bulleted_list',
        content: 'Advanced databases and formulas',
        properties: {}
      }
    ],
    createdBy: 'user1',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    permissions: {
      public: false,
      allowComments: true,
      allowEditing: true
    }
  },
  {
    id: 'page2',
    title: 'Project Tasks',
    icon: '📋',
    parentId: null,
    workspaceId: 'workspace2',
    content: [
      {
        id: 'block6',
        type: 'heading1',
        content: 'Project Management',
        properties: {}
      },
      {
        id: 'block7',
        type: 'database',
        content: '',
        properties: {
          databaseId: 'db1',
          viewType: 'table'
        }
      }
    ],
    createdBy: 'user1',
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T11:00:00Z',
    permissions: {
      public: true,
      allowComments: true,
      allowEditing: true
    }
  },
  {
    id: 'page3',
    title: 'Meeting Notes',
    icon: '💬',
    parentId: 'page2',
    workspaceId: 'workspace2',
    content: [
      {
        id: 'block8',
        type: 'heading2',
        content: 'Weekly Team Meeting',
        properties: {}
      },
      {
        id: 'block9',
        type: 'paragraph',
        content: 'Discussed project progress and next steps.',
        properties: {}
      }
    ],
    createdBy: 'user2',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    permissions: {
      public: false,
      allowComments: true,
      allowEditing: true
    }
  }
];

export const mockDatabases = [
  {
    id: 'db1',
    name: 'Tasks Database',
    properties: {
      title: {
        id: 'title',
        name: 'Name',
        type: 'title'
      },
      status: {
        id: 'status',
        name: 'Status',
        type: 'select',
        options: [
          { id: 'todo', name: 'To Do', color: 'red' },
          { id: 'progress', name: 'In Progress', color: 'yellow' },
          { id: 'done', name: 'Done', color: 'green' }
        ]
      },
      priority: {
        id: 'priority',
        name: 'Priority',
        type: 'select',
        options: [
          { id: 'low', name: 'Low', color: 'blue' },
          { id: 'medium', name: 'Medium', color: 'yellow' },
          { id: 'high', name: 'High', color: 'red' }
        ]
      },
      assignee: {
        id: 'assignee',
        name: 'Assignee',
        type: 'person'
      },
      dueDate: {
        id: 'dueDate',
        name: 'Due Date',
        type: 'date'
      },
      progress: {
        id: 'progress',
        name: 'Progress',
        type: 'number',
        format: 'percent'
      },
      formula: {
        id: 'formula',
        name: 'Days Until Due',
        type: 'formula',
        formula: 'dateBetween(prop("Due Date"), now(), "days")'
      }
    },
    rows: [
      {
        id: 'row1',
        properties: {
          title: 'Complete homepage design',
          status: 'progress',
          priority: 'high',
          assignee: 'user1',
          dueDate: '2024-01-15',
          progress: 75
        }
      },
      {
        id: 'row2',
        properties: {
          title: 'Implement user authentication',
          status: 'todo',
          priority: 'medium',
          assignee: 'user2',
          dueDate: '2024-01-20',
          progress: 0
        }
      },
      {
        id: 'row3',
        properties: {
          title: 'Write documentation',
          status: 'done',
          priority: 'low',
          assignee: 'user3',
          dueDate: '2024-01-10',
          progress: 100
        }
      }
    ],
    views: [
      {
        id: 'view1',
        name: 'All Tasks',
        type: 'table',
        isDefault: true,
        filter: {},
        sort: [{ property: 'dueDate', direction: 'ascending' }]
      },
      {
        id: 'view2',
        name: 'My Tasks',
        type: 'table',
        filter: { assignee: 'user1' },
        sort: [{ property: 'priority', direction: 'descending' }]
      },
      {
        id: 'view3',
        name: 'Kanban Board',
        type: 'kanban',
        groupBy: 'status',
        filter: {}
      }
    ]
  }
];

export const mockTemplates = [
  {
    id: 'template1',
    name: 'Project Planning',
    description: 'Complete project planning template with tasks, timeline, and resources',
    category: 'project-management',
    icon: '📋',
    content: [
      {
        type: 'heading1',
        content: 'Project Overview'
      },
      {
        type: 'paragraph',
        content: 'Brief description of the project goals and objectives.'
      },
      {
        type: 'heading2',
        content: 'Timeline'
      },
      {
        type: 'database',
        properties: { templateType: 'timeline' }
      }
    ]
  },
  {
    id: 'template2',
    name: 'Meeting Notes',
    description: 'Structure for effective meeting documentation',
    category: 'meetings',
    icon: '💬',
    content: [
      {
        type: 'heading1',
        content: 'Meeting Notes'
      },
      {
        type: 'paragraph',
        content: 'Date: Today'
      },
      {
        type: 'heading2',
        content: 'Attendees'
      },
      {
        type: 'bulleted_list',
        content: 'Person 1'
      },
      {
        type: 'heading2',
        content: 'Agenda'
      },
      {
        type: 'numbered_list',
        content: 'Topic 1'
      },
      {
        type: 'heading2',
        content: 'Action Items'
      },
      {
        type: 'checkbox',
        content: 'Action item 1'
      }
    ]
  }
];

export const mockAutomations = [
  {
    id: 'automation1',
    name: 'Task Assignment Notification',
    description: 'Send notification when a task is assigned to someone',
    trigger: {
      type: 'property_changed',
      property: 'assignee',
      database: 'db1'
    },
    actions: [
      {
        type: 'send_notification',
        message: 'You have been assigned a new task: {{title}}'
      }
    ],
    isActive: true
  },
  {
    id: 'automation2',
    name: 'Overdue Task Alert',
    description: 'Alert when tasks are overdue',
    trigger: {
      type: 'scheduled',
      schedule: 'daily',
      time: '09:00'
    },
    actions: [
      {
        type: 'send_notification',
        filter: 'prop("Due Date") < now() AND prop("Status") != "Done"',
        message: 'Task "{{title}}" is overdue!'
      }
    ],
    isActive: true
  }
];

export const mockComments = [
  {
    id: 'comment1',
    blockId: 'block1',
    userId: 'user2',
    content: 'Great introduction! Should we add more examples?',
    createdAt: '2024-01-01T10:30:00Z',
    resolved: false,
    replies: [
      {
        id: 'reply1',
        userId: 'user1',
        content: 'Good idea! I\'ll add some examples tomorrow.',
        createdAt: '2024-01-01T10:45:00Z'
      }
    ]
  }
];

export const mockActiveCursors = [
  {
    userId: 'user2',
    blockId: 'block2',
    position: 25,
    timestamp: Date.now() - 1000
  },
  {
    userId: 'user3',
    blockId: 'block3',
    position: 10,
    timestamp: Date.now() - 2000
  }
];

export const mockPermissions = {
  workspace: {
    'workspace1': {
      'user1': 'owner',
      'user2': 'editor',
      'user3': 'viewer'
    }
  },
  page: {
    'page1': {
      'user1': 'owner',
      'user2': 'editor',
      'user3': 'viewer'
    }
  },
  database: {
    'db1': {
      'user1': 'owner',
      'user2': 'editor',
      'user3': 'viewer'
    }
  }
};