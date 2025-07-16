import React from 'react';
import { Card, CardContent } from './ui/card';

const LoadingSpinner = ({ size = 'default', text = 'Loading...', fullScreen = true }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg'
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
              <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>{text}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;