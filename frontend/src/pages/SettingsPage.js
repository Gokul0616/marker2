import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeftIcon, 
  SettingsIcon, 
  UsersIcon, 
  TrashIcon, 
  BellIcon, 
  ShieldIcon,
  PaletteIcon,
  GlobalIcon,
  SaveIcon,
  UserPlusIcon,
  UserMinusIcon,
  CrownIcon
} from 'lucide-react';
import { workspaceAPI, trashAPI } from '../services/api';
import MFASettings from '../components/MFA/MFASettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [trashItems, setTrashItems] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [workspaceSettings, setWorkspaceSettings] = useState({
    theme: 'light',
    permissions: 'private',
    allowGuests: false,
    notifications: true,
    language: 'en',
    timezone: 'UTC'
  });
  const [workspaceInfo, setWorkspaceInfo] = useState({
    name: '',
    icon: '',
    description: ''
  });

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceInfo({
        name: currentWorkspace.name,
        icon: currentWorkspace.icon,
        description: currentWorkspace.description || ''
      });
      
      // Parse existing settings or use defaults
      const settings = typeof currentWorkspace.settings === 'string' 
        ? JSON.parse(currentWorkspace.settings) 
        : currentWorkspace.settings || {};
      
      setWorkspaceSettings({
        theme: settings.theme || 'light',
        permissions: settings.permissions || 'private',
        allowGuests: settings.allowGuests || false,
        notifications: settings.notifications || true,
        language: settings.language || 'en',
        timezone: settings.timezone || 'UTC'
      });
    }
  }, [currentWorkspace]);

  const handleSaveWorkspaceSettings = async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      const updateData = {
        name: workspaceInfo.name,
        icon: workspaceInfo.icon,
        settings: workspaceSettings
      };
      
      await workspaceAPI.updateWorkspace(currentWorkspace.id, updateData);
      await updateWorkspace(currentWorkspace.id, updateData);
      
      toast.success('Workspace settings updated successfully');
    } catch (error) {
      console.error('Error updating workspace settings:', error);
      toast.error('Failed to update workspace settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      setLoading(true);
      try {
        await workspaceAPI.deleteWorkspace(currentWorkspace.id);
        toast.success('Workspace deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting workspace:', error);
        toast.error('Failed to delete workspace');
      } finally {
        setLoading(false);
      }
    }
  };

  const isWorkspaceOwner = currentWorkspace && currentWorkspace.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5 text-gray-400" />
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              </div>
            </div>
            
            {currentWorkspace && (
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentWorkspace.icon}</span>
                <span className="font-medium text-gray-900">{currentWorkspace.name}</span>
                {isWorkspaceOwner && (
                  <Badge variant="secondary" className="text-xs">
                    <CrownIcon className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
          </TabsList>

          {/* Workspace Settings */}
          <TabsContent value="workspace">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <SettingsIcon className="h-5 w-5" />
                      <span>General</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                          id="workspace-name"
                          value={workspaceInfo.name}
                          onChange={(e) => setWorkspaceInfo({...workspaceInfo, name: e.target.value})}
                          placeholder="Enter workspace name"
                          disabled={!isWorkspaceOwner}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspace-icon">Icon</Label>
                        <Input
                          id="workspace-icon"
                          value={workspaceInfo.icon}
                          onChange={(e) => setWorkspaceInfo({...workspaceInfo, icon: e.target.value})}
                          placeholder="📁"
                          disabled={!isWorkspaceOwner}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="workspace-description">Description</Label>
                      <Input
                        id="workspace-description"
                        value={workspaceInfo.description}
                        onChange={(e) => setWorkspaceInfo({...workspaceInfo, description: e.target.value})}
                        placeholder="Describe your workspace"
                        disabled={!isWorkspaceOwner}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PaletteIcon className="h-5 w-5" />
                      <span>Appearance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={workspaceSettings.theme}
                          onValueChange={(value) => setWorkspaceSettings({...workspaceSettings, theme: value})}
                          disabled={!isWorkspaceOwner}
                        >
                          <SelectTrigger id="theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={workspaceSettings.language}
                          onValueChange={(value) => setWorkspaceSettings({...workspaceSettings, language: value})}
                          disabled={!isWorkspaceOwner}
                        >
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy & Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldIcon className="h-5 w-5" />
                      <span>Privacy & Permissions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="permissions">Workspace Visibility</Label>
                      <Select
                        value={workspaceSettings.permissions}
                        onValueChange={(value) => setWorkspaceSettings({...workspaceSettings, permissions: value})}
                        disabled={!isWorkspaceOwner}
                      >
                        <SelectTrigger id="permissions">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Guests</Label>
                        <p className="text-sm text-gray-500">
                          Allow non-members to view and comment on pages
                        </p>
                      </div>
                      <Switch
                        checked={workspaceSettings.allowGuests}
                        onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, allowGuests: checked})}
                        disabled={!isWorkspaceOwner}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BellIcon className="h-5 w-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive notifications about workspace activity
                        </p>
                      </div>
                      <Switch
                        checked={workspaceSettings.notifications}
                        onCheckedChange={(checked) => setWorkspaceSettings({...workspaceSettings, notifications: checked})}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                {isWorkspaceOwner && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveWorkspaceSettings} disabled={loading}>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Workspace Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{currentWorkspace?.icon}</div>
                      <div>
                        <p className="font-medium">{currentWorkspace?.name}</p>
                        <p className="text-sm text-gray-500">
                          {currentWorkspace?.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(currentWorkspace?.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                {isWorkspaceOwner && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteWorkspace}
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Workspace
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        This action cannot be undone
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Workspace Members</span>
                  <Badge variant="secondary" className="ml-2">
                    {currentWorkspace?.members?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentWorkspace?.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback style={{ backgroundColor: member.color }}>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.id === currentWorkspace.owner_id && (
                          <Badge variant="secondary">
                            <CrownIcon className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {isWorkspaceOwner && member.id !== currentWorkspace.owner_id && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <UserMinusIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isWorkspaceOwner && (
                    <Button variant="outline" className="w-full">
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback style={{ backgroundColor: user?.color }}>
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user?.name}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <MFASettings user={user} onUserUpdate={() => {}} />
            </div>
          </TabsContent>

          {/* Trash Tab */}
          <TabsContent value="trash">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5" />
                  <span>Trash</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrashIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items in trash</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Deleted items will appear here and can be restored within 30 days
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;