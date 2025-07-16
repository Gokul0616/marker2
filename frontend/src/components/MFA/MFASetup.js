import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { Copy, Check, Shield, AlertTriangle } from 'lucide-react';

const MFASetup = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: confirm, 2: show codes, 3: verify
  const [backupCodes, setBackupCodes] = useState([]);
  const [testCode, setTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleEnableMFA = async () => {
    setLoading(true);
    try {
      const response = await authAPI.enableMFA();
      setBackupCodes(response.backup_codes);
      setStep(2);
      toast.success('MFA enabled successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enable MFA');
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

  const handleVerifyCode = async () => {
    if (!testCode.trim()) {
      toast.error('Please enter a backup code');
      return;
    }

    setLoading(true);
    try {
      // Since we don't have a test endpoint, we'll just simulate verification
      if (backupCodes.includes(testCode.trim())) {
        toast.success('Backup code verified successfully!');
        onComplete();
      } else {
        toast.error('Invalid backup code');
      }
    } catch (error) {
      toast.error('Failed to verify backup code');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Enable Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with backup codes for additional protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important:</p>
              <p className="text-sm text-amber-700">
                Once enabled, you'll need a backup code to login. Keep your backup codes safe and secure.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnableMFA} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Enabling...' : 'Enable MFA'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle className="text-xl">Save Your Backup Codes</CardTitle>
        <CardDescription>
          Store these codes in a safe place. You'll need them to login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-white p-2 rounded border text-center">
                {code}
              </div>
            ))}
          </div>
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
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Warning:</p>
              <p className="text-sm text-red-700">
                Each backup code can only be used once. Save them securely!
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => setStep(3)} 
          className="w-full"
        >
          Continue to Verification
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Verify Your Setup</CardTitle>
        <CardDescription>
          Enter one of your backup codes to verify MFA is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testCode">Backup Code</Label>
          <Input
            id="testCode"
            type="text"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="Enter a backup code"
            className="font-mono"
          />
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => setStep(2)} 
            variant="outline" 
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleVerifyCode} 
            disabled={loading || !testCode.trim()}
            className="flex-1"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default MFASetup;