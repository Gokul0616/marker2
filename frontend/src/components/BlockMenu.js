import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  TypeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  CheckSquareIcon,
  CodeIcon,
  QuoteIcon,
  ImageIcon,
  DatabaseIcon,
  CalendarIcon,
  FileIcon,
  TableIcon,
  ExternalLinkIcon,
  AtSignIcon
} from 'lucide-react';

const BlockMenu = ({ position, onSelect, onClose }) => {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const blockTypes = [
    { type: 'paragraph', icon: TypeIcon, label: 'Text', description: 'Just start writing with plain text' },
    { type: 'heading1', icon: Heading1Icon, label: 'Heading 1', description: 'Big section heading' },
    { type: 'heading2', icon: Heading2Icon, label: 'Heading 2', description: 'Medium section heading' },
    { type: 'heading3', icon: Heading3Icon, label: 'Heading 3', description: 'Small section heading' },
    { type: 'bulleted_list', icon: ListIcon, label: 'Bulleted List', description: 'Create a simple bulleted list' },
    { type: 'numbered_list', icon: ListIcon, label: 'Numbered List', description: 'Create a list with numbering' },
    { type: 'checkbox', icon: CheckSquareIcon, label: 'To-do List', description: 'Track tasks with a to-do list' },
    { type: 'code', icon: CodeIcon, label: 'Code', description: 'Capture a code snippet' },
    { type: 'quote', icon: QuoteIcon, label: 'Quote', description: 'Capture a quote' },
    { type: 'image', icon: ImageIcon, label: 'Image', description: 'Upload or embed an image' },
    { type: 'database', icon: DatabaseIcon, label: 'Database', description: 'Create a database' },
  ];

  const filteredTypes = blockTypes.filter(type =>
    type.label.toLowerCase().includes(filter.toLowerCase()) ||
    type.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredTypes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredTypes.length) % filteredTypes.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTypes[selectedIndex]) {
          onSelect(filteredTypes[selectedIndex].type);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredTypes, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 w-80"
      style={{ 
        left: position.x, 
        top: position.y,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="px-3 pb-2 border-b border-gray-100">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a block type..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setSelectedIndex(0);
          }}
          className="w-full text-sm border-none focus:ring-0 p-0"
        />
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {filteredTypes.length > 0 ? (
          filteredTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.type}
                onClick={() => onSelect(type.type)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-3 ${
                  index === selectedIndex ? 'bg-gray-50' : ''
                }`}
              >
                <IconComponent className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 truncate">{type.description}</div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500">
            No blocks found for "{filter}"
          </div>
        )}
      </div>
      
      <div className="px-3 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          ↑↓ to navigate • ↵ to select • esc to close
        </div>
      </div>
    </div>
  );
};

export default BlockMenu;