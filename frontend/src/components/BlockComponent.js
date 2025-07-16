import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
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
  DatabaseIcon
} from 'lucide-react';

const BlockComponent = ({
  block,
  onChange,
  onTypeChange,
  onDelete,
  onFocus,
  onBlur,
  onKeyDown,
  onCursorMove,
  canEdit,
  isFocused,
  isSelected,
  pageId
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleContentChange = (e) => {
    const value = e.target.value;
    onChange(value);
    
    // Update cursor position for collaboration
    if (onCursorMove) {
      onCursorMove(e.target.selectionStart || 0);
    }
  };

  const handleCheckboxChange = (checked) => {
    onChange(block.content, { checked });
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
    const baseClasses = "w-full border-none outline-none resize-none bg-transparent";
    const focusClasses = canEdit ? "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" : "";
    
    switch (block.type) {
      case 'heading1':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-3xl font-bold py-2`}
            placeholder="Heading 1"
            readOnly={!canEdit}
          />
        );
      
      case 'heading2':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-2xl font-bold py-2`}
            placeholder="Heading 2"
            readOnly={!canEdit}
          />
        );
      
      case 'heading3':
        return (
          <input
            ref={inputRef}
            type="text"
            value={block.content}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} text-xl font-bold py-2`}
            placeholder="Heading 3"
            readOnly={!canEdit}
          />
        );
      
      case 'bulleted_list':
        return (
          <div className="flex items-start space-x-2">
            <span className="text-lg leading-6 mt-1">•</span>
            <input
              ref={inputRef}
              type="text"
              value={block.content}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1`}
              placeholder="List item"
              readOnly={!canEdit}
            />
          </div>
        );
      
      case 'numbered_list':
        return (
          <div className="flex items-start space-x-2">
            <span className="text-lg leading-6 mt-1">1.</span>
            <input
              ref={inputRef}
              type="text"
              value={block.content}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1`}
              placeholder="List item"
              readOnly={!canEdit}
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
              value={block.content}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} flex-1 py-1 ${
                block.properties?.checked ? 'line-through text-gray-500' : ''
              }`}
              placeholder="To-do item"
              readOnly={!canEdit}
            />
          </div>
        );
      
      case 'code':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Select value={block.properties?.language || 'javascript'} onValueChange={(lang) => onChange(block.content, { language: lang })}>
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} font-mono text-sm min-h-[100px] bg-transparent`}
              placeholder="Enter code..."
              readOnly={!canEdit}
            />
          </div>
        );
      
      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 italic">
            <textarea
              ref={inputRef}
              value={block.content}
              onChange={handleContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              className={`${baseClasses} ${focusClasses} text-gray-700 min-h-[60px]`}
              placeholder="Quote"
              readOnly={!canEdit}
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {block.content ? (
              <img 
                src={block.content} 
                alt="Block image" 
                className="max-w-full h-auto mx-auto"
              />
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-gray-500">Add an image</p>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    Upload Image
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      
      case 'database':
        return (
          <div className="border border-gray-300 rounded-lg p-4">
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
            value={block.content}
            onChange={handleContentChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={`${baseClasses} ${focusClasses} min-h-[40px] leading-relaxed py-2`}
            placeholder="Type '/' for commands"
            readOnly={!canEdit}
            rows={1}
            style={{ resize: 'none' }}
          />
        );
    }
  };

  return (
    <div 
      className={`relative group ${isSelected ? 'bg-blue-50' : ''} ${
        isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block Controls */}
      {canEdit && (isHovered || isFocused) && (
        <div className="absolute -left-8 top-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
          >
            <GripVerticalIcon className="h-3 w-3" />
          </Button>
          
          {showTypeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-48">
              <div className="space-y-1">
                {[
                  { type: 'paragraph', label: 'Text', icon: TypeIcon },
                  { type: 'heading1', label: 'Heading 1', icon: Heading1Icon },
                  { type: 'heading2', label: 'Heading 2', icon: Heading2Icon },
                  { type: 'heading3', label: 'Heading 3', icon: Heading3Icon },
                  { type: 'bulleted_list', label: 'Bulleted List', icon: ListIcon },
                  { type: 'numbered_list', label: 'Numbered List', icon: ListIcon },
                  { type: 'checkbox', label: 'To-do', icon: CheckSquareIcon },
                  { type: 'code', label: 'Code', icon: CodeIcon },
                  { type: 'quote', label: 'Quote', icon: QuoteIcon },
                  { type: 'image', label: 'Image', icon: ImageIcon },
                  { type: 'database', label: 'Database', icon: DatabaseIcon }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    className="flex items-center space-x-2 w-full px-2 py-1 text-left hover:bg-gray-100 rounded"
                    onClick={() => {
                      onTypeChange(type);
                      setShowTypeMenu(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Block Content */}
      <div className="min-h-[40px] flex items-center">
        {renderBlockContent()}
      </div>

      {/* Block Actions */}
      {canEdit && (isHovered || isFocused) && (
        <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDelete}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlockComponent;