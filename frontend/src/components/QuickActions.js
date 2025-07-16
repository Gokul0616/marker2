import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  FileTextIcon, 
  DatabaseIcon, 
  PlusIcon,
  FileIcon,
  ImportIcon,
  CogIcon,
  ZapIcon
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();
  const { createPage } = useWorkspace();
  const { createDatabase, templates } = useNotion();

  const handleCreatePage = () => {
    const newPage = createPage();
    navigate(`/page/${newPage.id}`);
  };

  const handleCreateDatabase = () => {
    const newDb = createDatabase('New Database');
    navigate(`/database/${newDb.id}`);
  };

  const quickActions = [
    {
      id: 'create-page',
      title: 'Create Page',
      description: 'Start with a blank page',
      icon: FileTextIcon,
      color: 'blue',
      action: handleCreatePage,
      shortcut: '⌘N'
    },
    {
      id: 'create-database',
      title: 'Create Database',
      description: 'Organize data in tables',
      icon: DatabaseIcon,
      color: 'green',
      action: handleCreateDatabase,
      shortcut: '⌘⇧D'
    },
    {
      id: 'use-template',
      title: 'Use Template',
      description: 'Start with a template',
      icon: FileIcon,
      color: 'purple',
      action: () => navigate('/templates'),
      badge: `${templates.length} available`
    },
    {
      id: 'import',
      title: 'Import',
      description: 'Import from other apps',
      icon: ImportIcon,
      color: 'orange',
      action: () => console.log('Import'),
      badge: 'New'
    },
    {
      id: 'automation',
      title: 'Create Automation',
      description: 'Automate your workflow',
      icon: ZapIcon,
      color: 'yellow',
      action: () => navigate('/automations'),
      badge: 'Beta'
    },
    {
      id: 'settings',
      title: 'Workspace Settings',
      description: 'Configure your workspace',
      icon: CogIcon,
      color: 'gray',
      action: () => navigate('/settings')
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-500 bg-blue-50',
      green: 'text-green-500 bg-green-50',
      purple: 'text-purple-500 bg-purple-50',
      orange: 'text-orange-500 bg-orange-50',
      yellow: 'text-yellow-500 bg-yellow-50',
      gray: 'text-gray-500 bg-gray-50'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <Button variant="outline" size="sm">
          Customize
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.id} 
              className="hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
              onClick={action.action}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${getColorClasses(action.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                    {action.shortcut && (
                      <Badge variant="outline" className="text-xs">
                        {action.shortcut}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-base mb-1">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recent Actions</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-1 bg-blue-100 text-blue-500 rounded">
              <FileTextIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Created "Project Planning" page</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-1 bg-green-100 text-green-500 rounded">
              <DatabaseIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Added 5 rows to Tasks Database</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-1 bg-purple-100 text-purple-500 rounded">
              <ZapIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Created automation "Task Reminder"</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;