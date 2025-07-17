import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  GripVerticalIcon, 
  MoreHorizontalIcon, 
  TrashIcon,
  ImageIcon,
  CodeIcon,
  QuoteIcon,
  ListIcon,
  CheckSquareIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  TypeIcon,
  DatabaseIcon,
  CopyIcon,
  MoveIcon
} from 'lucide-react';

const BlockComponent = ({
  block,
  onChange,
  onTypeChange,
  onDelete,
  onDuplicate,
  onFocus,
  onBlur,
  onKeyDown,
  onDragStart,
  onCursorMove,
  canEdit,
  isFocused,
  isSelected,
  pageId
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleContentChange = (e) => {
    const value = e.target.value;
    
    // Check if user typed "/" to show command menu
    if (value === '/' && !showCommandMenu) {
      setShowCommandMenu(true);
      setCommandSearch('');
      return;
    }
    
    // If command menu is open and user is typing
    if (showCommandMenu && value.startsWith('/')) {
      setCommandSearch(value.slice(1));
      return;
    }
    
    // If command menu is open but user cleared the /
    if (showCommandMenu && !value.startsWith('/')) {
      setShowCommandMenu(false);
      setCommandSearch('');
    }
    
    onChange(value);
    
    // Update cursor position for collaboration
    if (onCursorMove) {
      onCursorMove(e.target.selectionStart || 0);
    }
  };

  const handleKeyDown = (e) => {
    if (showCommandMenu) {
      if (e.key === 'Escape') {
        setShowCommandMenu(false);
        setCommandSearch('');
        return;
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedCommand = getFilteredCommands()[0];
        if (selectedCommand) {
          executeCommand(selectedCommand);
        }
        return;
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const executeCommand = (command) => {
    if (onTypeChange) {
      onTypeChange(command.type);
    }
    setShowCommandMenu(false);
    setCommandSearch('');
  };

  const getCommands = () => [
    {
      id: 'paragraph',
      type: 'paragraph',
      title: 'Text',
      description: 'Just start writing with plain text',
      icon: TypeIcon,
      keywords: ['text', 'paragraph', 'p']
    },
    {
      id: 'heading1',
      type: 'heading1',
      title: 'Heading 1',
      description: 'Big section heading',
      icon: Heading1Icon,
      keywords: ['heading', 'h1', 'title']
    },
    {
      id: 'heading2',
      type: 'heading2',
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2Icon,
      keywords: ['heading', 'h2', 'subtitle']
    },
    {
      id: 'heading3',
      type: 'heading3',
      title: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3Icon,
      keywords: ['heading', 'h3']
    },
    {
      id: 'bulleted_list',
      type: 'bulleted_list',
      title: 'Bulleted List',
      description: 'Create a simple bulleted list',
      icon: ListIcon,
      keywords: ['list', 'bullet', 'ul']
    },
    {
      id: 'numbered_list',
      type: 'numbered_list',
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: ListIcon,
      keywords: ['list', 'number', 'ol', 'ordered']
    },
    {
      id: 'checkbox',
      type: 'checkbox',
      title: 'To-do List',
      description: 'Track tasks with a to-do list',
      icon: CheckSquareIcon,
      keywords: ['todo', 'task', 'check', 'checkbox']
    },
    {
      id: 'quote',
      type: 'quote',
      title: 'Quote',
      description: 'Capture a quote',
      icon: QuoteIcon,
      keywords: ['quote', 'blockquote', 'cite']
    },
    {
      id: 'code',
      type: 'code',
      title: 'Code',
      description: 'Capture a code snippet',
      icon: CodeIcon,
      keywords: ['code', 'snippet', 'programming']
    },
    {
      id: 'image',
      type: 'image',
      title: 'Image',
      description: 'Upload or embed an image',
      icon: ImageIcon,
      keywords: ['image', 'picture', 'photo', 'img']
    },
    {
      id: 'database',
      type: 'database',
      title: 'Database',
      description: 'Create a database',
      icon: DatabaseIcon,
      keywords: ['database', 'table', 'data', 'db']
    }
  ];

  const getFilteredCommands = () => {
    const commands = getCommands();
    if (!commandSearch) return commands;
    
    return commands.filter(command => 
      command.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
      command.description.toLowerCase().includes(commandSearch.toLowerCase()) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(commandSearch.toLowerCase()))
    );
  };

  const handleCheckboxChange = (checked) => {
    onChange(block.content, { checked });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBlockIcon = (type) => {
    const icons = {
      paragraph: TypeIcon,
      heading1: Heading1Icon,
      heading2: Heading2Icon,
      heading3: Heading3Icon,
      bulleted_list: ListIcon,
      numbered_list: ListIcon,
      checkbox: CheckSquareIcon,
      code: CodeIcon,
      quote: QuoteIcon,
      image: ImageIcon,
      database: DatabaseIcon
    };
    return icons[type] || TypeIcon;
  };

  const renderBlockContent = () => {
    const baseClasses = "w-full border-none outline-none resize-none bg-transparent placeholder-gray-400 focus:placeholder-gray-300";
    const focusClasses = canEdit ? "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500" : "cursor-default";
    
    switch (block.type) {
      case 'heading1':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content || ''}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-3xl font-bold py-2 leading-tight`}
            placeholder="Heading 1"
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        );
      
      case 'heading2':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content || ''}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-2xl font-bold py-2 leading-tight`}
            placeholder="Heading 2"
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        );
      
      case 'heading3':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content || ''}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-xl font-bold py-2 leading-tight`}
            placeholder="Heading 3"
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        );
      
      case 'bulleted_list':
        return (
          <div className="flex items-start space-x-2">
            <span className="text-lg leading-6 mt-1 text-gray-600">•</span>
            <input
              ref={inputRef}
              type="text"
              value={block.content || ''}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1 leading-relaxed`}
              placeholder="List item"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </div>
        );
      
      case 'numbered_list':
        return (
          <div className="flex items-start space-x-2">
            <span className="text-lg leading-6 mt-1 text-gray-600">1.</span>
            <input
              ref={inputRef}
              type="text"
              value={block.content || ''}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1 leading-relaxed`}
              placeholder="List item"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-start space-x-2">
            <Checkbox
              checked={block.properties?.checked || false}
              onCheckedChange={handleCheckboxChange}
              disabled={!canEdit}
              className="mt-1"
            />
            <input
              ref={inputRef}
              type="text"
              value={block.content || ''}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1 leading-relaxed ${
                block.properties?.checked ? 'line-through text-gray-500' : ''
              }`}
              placeholder="To-do item"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </div>
        );
      
      case 'code':
        return (
          <div className="bg-gray-100 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <Select 
                value={block.properties?.language || 'javascript'} 
                onValueChange={(lang) => onChange(block.content, { language: lang })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <textarea
              ref={inputRef}
              value={block.content || ''}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} font-mono text-sm min-h-[100px] bg-transparent`}
              placeholder="Enter code..."
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </div>
        );
      
      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 bg-gray-50 rounded-r-lg py-2">
            <textarea
              ref={inputRef}
              value={block.content || ''}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} text-gray-700 min-h-[60px] italic bg-transparent`}
              placeholder="Quote"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            {block.content ? (
              <div className="relative group">
                <img 
                  src={block.content} 
                  alt="Block image" 
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
                {canEdit && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onChange('')}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-gray-500">Add an image</p>
                {canEdit && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id={`image-upload-${block.id}`}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById(`image-upload-${block.id}`).click()}
                    >
                      Upload Image
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      
      case 'database':
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <DatabaseIcon className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Database</span>
              <Badge variant="secondary" className="text-xs">
                {block.properties?.databaseId || 'New'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Click to open database view
            </p>
          </div>
        );
      
      default:
        return (
          <textarea
            ref={inputRef}
            value={block.content || ''}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} min-h-[40px] leading-relaxed py-2`}
            placeholder="Type '/' for commands, or just start writing..."
            readOnly={!canEdit}
            disabled={!canEdit}
            rows={1}
            style={{ resize: 'none' }}
          />
        );
    }
  };

  return (
    <div
      className={`relative group transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } ${isHovered ? 'bg-gray-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={canEdit}
      onDragStart={onDragStart}
    >
      {/* Block Controls */}
      {canEdit && (isHovered || isFocused) && (
        <div className="absolute left-0 top-0 flex items-center space-x-1 -ml-12 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => e.preventDefault()}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
            
            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[120px]">
                <button
                  onClick={() => onDuplicate()}
                  className="flex items-center w-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CopyIcon className="h-3 w-3 mr-2" />
                  Duplicate
                </button>
                <button
                  onClick={() => onDelete()}
                  className="flex items-center w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-3 w-3 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block Content */}
      <div className="px-2 py-1">
        {renderBlockContent()}
      </div>

      {/* Click outside to close menu */}
      {showTypeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowTypeMenu(false)}
        />
      )}
    </div>
  );
};

export default BlockComponent;