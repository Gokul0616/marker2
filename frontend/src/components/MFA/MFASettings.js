import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { Shield, RefreshCw, ShieldOff, Copy, Check } from 'lucide-react';

const MFASettings = ({ user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleDisableMFA = async () => {
    setLoading(true);
    try {
      await authAPI.disableMFA();
      toast.success('MFA disabled successfully');
      onUserUpdate({ ...user, mfa_enabled: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await authAPI.regenerateBackupCodes();
      setBackupCodes(response.backup_codes);
      setShowBackupCodes(true);
      toast.success('Backup codes regenerated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    const codesText = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      toast.success('Backup codes copied to clipboard');
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (error) {
      toast.error('Failed to copy backup codes');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Multi-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Secure your account with backup codes for additional protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">MFA Status</p>
            <p className="text-sm text-gray-600">
              {user.mfa_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {user.mfa_enabled ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500">
                <ShieldOff className="w-4 h-4" />
                <span className="text-sm font-medium">Inactive</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {user.mfa_enabled ? (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Backup Codes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Regenerate Backup Codes</DialogTitle>
                    <DialogDescription>
                      This will invalidate all existing backup codes and generate new ones.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to regenerate your backup codes? Your current codes will no longer work.
                    </p>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handleRegenerateBackupCodes} 
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Regenerating...' : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Disable MFA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Disable Multi-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      This will remove the additional security layer from your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to disable MFA? This will make your account less secure.
                    </p>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handleDisableMFA} 
                        disabled={loading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {loading ? 'Disabling...' : 'Disable MFA'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button 
              onClick={() => window.location.href = '/mfa-setup'} 
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Enable MFA
            </Button>
          )}
        </div>

        {/* Backup Codes Display */}
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Your New Backup Codes</h3>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono mb-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
            <Button 
              onClick={handleCopyBackupCodes} 
              variant="outline" 
              className="w-full"
            >
              {copiedCodes ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Backup Codes
                </>
              )}
            </Button>
            <p className="text-xs text-blue-700 mt-2">
              Save these codes in a secure location. Each code can only be used once.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MFASettings;