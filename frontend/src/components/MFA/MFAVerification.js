import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { Shield, AlertTriangle } from 'lucide-react';

const MFAVerification = ({ userId, onSuccess, onCancel }) => {
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!backupCode.trim()) {
      toast.error('Please enter a backup code');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyMFA(userId, backupCode.trim());
      
      // Store auth token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      toast.success('MFA verification successful!');
      onSuccess(response);
    } catch (error) {
      setAttemptCount(prev => prev + 1);
      const errorMessage = error.response?.data?.detail || 'Invalid backup code';
      toast.error(errorMessage);
      
      if (attemptCount >= 2) {
        toast.error('Too many failed attempts. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Multi-Factor Authentication</CardTitle>
          <CardDescription>
            Enter one of your backup codes to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backupCode">Backup Code</Label>
              <Input
                id="backupCode"
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                required
                placeholder="Enter your backup code"
                className="font-mono"
                autoComplete="off"
              />
            </div>
            
            {attemptCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Attempt {attemptCount} of 3
                    </p>
                    <p className="text-sm text-amber-700">
                      {attemptCount === 1 && "Please double-check your backup code"}
                      {attemptCount === 2 && "Last attempt before temporary lockout"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button 
                type="button"
                onClick={onCancel} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || attemptCount >= 3}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Don't have your backup codes?</p>
            <p>Contact your administrator for help.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerification;