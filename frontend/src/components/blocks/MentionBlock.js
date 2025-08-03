import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { 
  AtSignIcon, 
  FileTextIcon, 
  CalendarIcon,
  UserIcon,
  HashIcon
} from 'lucide-react';

const MentionBlock = ({ 
  content, 
  onChange, 
  onMention, 
  canEdit, 
  className = "" 
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const mentionMenuRef = useRef(null);
  const { pages, currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  // Mock users and dates for mentions
  const mockUsers = [
    { id: 'user1', name: 'John Doe', avatar: '👤' },
    { id: 'user2', name: 'Jane Smith', avatar: '👤' },
  ];

  const mockDates = [
    { id: 'today', name: 'Today', date: new Date() },
    { id: 'tomorrow', name: 'Tomorrow', date: new Date(Date.now() + 86400000) },
  ];

  const getMentionables = () => {
    const items = [];
    
    // Add pages
    pages.forEach(page => {
      items.push({
        id: `page-${page.id}`,
        type: 'page',
        name: page.title || 'Untitled',
        icon: page.icon || '📄',
        IconComponent: FileTextIcon,
        page: page
      });
    });

    // Add users
    mockUsers.forEach(user => {
      items.push({
        id: `user-${user.id}`,
        type: 'user',
        name: user.name,
        icon: user.avatar,
        IconComponent: UserIcon,
        user: user
      });
    });

    // Add dates
    mockDates.forEach(dateObj => {
      items.push({
        id: `date-${dateObj.id}`,
        type: 'date',
        name: dateObj.name,
        icon: '📅',
        IconComponent: CalendarIcon,
        date: dateObj.date
      });
    });

    return items;
  };

  const filterMentionables = (query) => {
    const mentionables = getMentionables();
    if (!query) return mentionables;
    
    return mentionables.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ symbol
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const mentionText = textBeforeCursor.substring(atIndex + 1);
      if (!mentionText.includes(' ')) {
        // Show mentions
        setMentionQuery(mentionText);
        setShowMentions(true);
        setSelectedIndex(0);
        
        // Position mention menu
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          x: rect.left,
          y: rect.bottom + 5
        });
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    onChange(value);
  };

  const handleKeyDown = (e) => {
    if (!showMentions) return;
    
    const filteredItems = filterMentionables(mentionQuery);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        insertMention(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const insertMention = (item) => {
    const input = inputRef.current;
    const cursorPosition = input.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    // Create mention text based on type
    let mentionText;
    switch (item.type) {
      case 'page':
        mentionText = `@[[${item.page.id}|${item.name}]]`;
        break;
      case 'user':
        mentionText = `@${item.name}`;
        break;
      case 'date':
        mentionText = `@${item.date.toLocaleDateString()}`;
        break;
      default:
        mentionText = `@${item.name}`;
    }
    
    const newContent = 
      textBeforeCursor.substring(0, atIndex) + 
      mentionText + 
      textAfterCursor;
    
    onChange(newContent);
    setShowMentions(false);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      const newCursorPosition = atIndex + mentionText.length;
      input.focus();
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
    
    // Trigger mention callback if provided
    if (onMention) {
      onMention(item);
    }
  };

  const renderMentionText = (text) => {
    // Parse page mentions
    const pageMentionRegex = /@\[\[([^|]+)\|([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = pageMentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention component
      const pageId = match[1];
      const pageName = match[2];
      parts.push(
        <button
          key={`mention-${pageId}-${match.index}`}
          className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-sm font-medium hover:bg-blue-200 cursor-pointer"
          onClick={() => navigate(`/page/${pageId}`)}
        >
          <FileTextIcon className="h-3 w-3 mr-1" />
          {pageName}
        </button>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target)) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMentionables = filterMentionables(mentionQuery);

  if (canEdit) {
    return (
      <div className={`relative ${className}`}>
        <textarea
          ref={inputRef}
          value={content || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full border-none outline-none resize-none bg-transparent placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-h-[40px] leading-relaxed py-2"
          placeholder="Type '@' to mention pages, people, or dates..."
          rows={1}
        />
        
        {/* Mention Menu */}
        {showMentions && filteredMentionables.length > 0 && (
          <div
            ref={mentionMenuRef}
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[250px] max-h-[200px] overflow-y-auto"
            style={{
              left: mentionPosition.x,
              top: mentionPosition.y
            }}
          >
            {filteredMentionables.map((item, index) => {
              const IconComponent = item.IconComponent;
              return (
                <button
                  key={item.id}
                  onClick={() => insertMention(item)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2 ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <IconComponent className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{item.type}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Read-only mode
  return (
    <div className={`${className} py-2`}>
      {renderMentionText(content || '')}
    </div>
  );
};

export default MentionBlock;