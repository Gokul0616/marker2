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
  SmileIcon,
  LockIcon,
  GlobeIcon
} from 'lucide-react';

const PageHeader = ({ 
  page, 
  onTitleChange, 
  onIconChange, 
  canEdit, 
  isEditing, 
  setIsEditing 
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(page.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      onTitleChange(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(page.title);
      setIsEditingTitle(false);
    }
  };

  const commonEmojis = [
    '📝', '📋', '📊', '💼', '🚀', '💡', '🎯', '📈', 
    '🔥', '⭐', '✨', '🎉', '📱', '💻', '🌟', '🔧',
    '📚', '🎨', '🎵', '🎪', '🌈', '🌍', '🔮', '🎪'
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
              <Badge variant={page.permissions?.public ? "default" : "secondary"} className="text-xs">
                {page.permissions?.public ? (
                  <>
                    <GlobeIcon className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <LockIcon className="h-3 w-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
              {page.parentId && (
                <Badge variant="outline" className="text-xs">
                  Nested page
                </Badge>
              )}
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

      {/* Page Title Section */}
      <div className="px-6 pb-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="relative">
            <button
              className="text-4xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => canEdit && setShowEmojiPicker(!showEmojiPicker)}
              disabled={!canEdit}
            >
              {page.icon || '📄'}
            </button>
            
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="text-xl hover:bg-gray-100 p-2 rounded transition-colors"
                      onClick={() => {
                        onIconChange(emoji);
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
            {isEditingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold border-none p-0 focus:ring-0 focus:border-none"
                autoFocus
                placeholder="Untitled"
              />
            ) : (
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => canEdit && setIsEditingTitle(true)}
              >
                {page.title || 'Untitled'}
              </h1>
            )}
            
            {/* Breadcrumb */}
            {page.parentId && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                <span>in</span>
                <button className="hover:text-gray-700">
                  Parent Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;