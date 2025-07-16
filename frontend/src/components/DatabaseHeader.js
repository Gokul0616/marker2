import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  ArrowLeftIcon, 
  StarIcon, 
  ShareIcon, 
  MoreHorizontalIcon,
  DatabaseIcon,
  SmileIcon,
  LockIcon,
  GlobeIcon,
  UsersIcon
} from 'lucide-react';

const DatabaseHeader = ({ database, onUpdateDatabase, onShowPropertyEditor }) => {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(database.name);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleNameSubmit = () => {
    if (nameValue.trim()) {
      onUpdateDatabase(database.id, { name: nameValue.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setNameValue(database.name);
      setIsEditingName(false);
    }
  };

  const commonEmojis = [
    '📊', '📈', '📉', '📋', '📝', '💼', '🗂️', '📁', 
    '🎯', '💡', '🔥', '⭐', '✨', '🎉', '🚀', '🔧'
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <DatabaseIcon className="h-3 w-3 mr-1" />
                Database
              </Badge>
              <Badge variant="outline" className="text-xs">
                {database.rows.length} rows
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Object.keys(database.properties).length} properties
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <StarIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ShareIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Database Title Section */}
      <div className="px-6 pb-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="relative">
            <button
              className="text-4xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              📊
            </button>
            
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="text-xl hover:bg-gray-100 p-2 rounded transition-colors"
                      onClick={() => {
                        // Update database icon
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <SmileIcon className="h-4 w-4 mr-2" />
                    More emojis...
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1">
            {isEditingName ? (
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                className="text-3xl font-bold border-none p-0 focus:ring-0 focus:border-none"
                autoFocus
                placeholder="Database name"
              />
            ) : (
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {database.name}
              </h1>
            )}
            
            {/* Database Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center space-x-1">
                <DatabaseIcon className="h-4 w-4" />
                <span>{database.rows.length} rows</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>•</span>
                <span>{Object.keys(database.properties).length} properties</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>•</span>
                <span>{database.views.length} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4" />
                <span>Shared with team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Description */}
        <div className="mt-4">
          <p className="text-gray-600">
            {database.description || 'Add a description...'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowPropertyEditor}
          >
            Add Property
          </Button>
          <Button variant="outline" size="sm">
            Add View
          </Button>
          <Button variant="outline" size="sm">
            Add Filter
          </Button>
          <Button variant="outline" size="sm">
            Add Sort
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseHeader;