import React, { useState, useEffect, useRef } from 'react';
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
  FileTextIcon,
  TableIcon,
  BarChart3Icon,
  PieChartIcon,
  MapIcon,
  VideoIcon,
  MusicIcon,
  FolderIcon,
  LinkIcon,
  HashIcon,
  AtSignIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon
} from 'lucide-react';

const BlockMenu = ({ position, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const blockTypes = [
    {
      category: 'Basic blocks',
      items: [
        { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text', icon: TypeIcon, keywords: ['text', 'paragraph', 'p'] },
        { type: 'heading1', label: 'Heading 1', description: 'Big section heading', icon: Heading1Icon, keywords: ['heading', 'h1', 'title'] },
        { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2Icon, keywords: ['heading', 'h2', 'subtitle'] },
        { type: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: Heading3Icon, keywords: ['heading', 'h3', 'subheading'] },
        { type: 'bulleted_list', label: 'Bulleted list', description: 'Create a simple bulleted list', icon: ListIcon, keywords: ['list', 'bullet', 'ul'] },
        { type: 'numbered_list', label: 'Numbered list', description: 'Create a list with numbering', icon: ListIcon, keywords: ['list', 'number', 'ol', 'ordered'] },
        { type: 'checkbox', label: 'To-do list', description: 'Track tasks with a to-do list', icon: CheckSquareIcon, keywords: ['todo', 'task', 'checkbox', 'check'] },
        { type: 'code', label: 'Code', description: 'Capture a code snippet', icon: CodeIcon, keywords: ['code', 'snippet', 'programming'] },
        { type: 'quote', label: 'Quote', description: 'Capture a quote', icon: QuoteIcon, keywords: ['quote', 'citation', 'blockquote'] }
      ]
    },
    {
      category: 'Media',
      items: [
        { type: 'image', label: 'Image', description: 'Upload or embed with a link', icon: ImageIcon, keywords: ['image', 'photo', 'picture', 'img'] },
        { type: 'video', label: 'Video', description: 'Embed from YouTube, Vimeo, etc.', icon: VideoIcon, keywords: ['video', 'youtube', 'vimeo'] },
        { type: 'audio', label: 'Audio', description: 'Embed an audio file', icon: MusicIcon, keywords: ['audio', 'music', 'sound'] },
        { type: 'file', label: 'File', description: 'Upload a file', icon: FileTextIcon, keywords: ['file', 'upload', 'document'] },
        { type: 'link', label: 'Link Preview', description: 'Create a visual link preview', icon: LinkIcon, keywords: ['link', 'url', 'preview'] }
      ]
    },
    {
      category: 'Database',
      items: [
        { type: 'database', label: 'Database', description: 'Create a database', icon: DatabaseIcon, keywords: ['database', 'table', 'data'] },
        { type: 'table', label: 'Table', description: 'Add a simple table', icon: TableIcon, keywords: ['table', 'grid', 'spreadsheet'] },
        { type: 'kanban', label: 'Board', description: 'Kanban board for project management', icon: TableIcon, keywords: ['kanban', 'board', 'project'] },
        { type: 'calendar', label: 'Calendar', description: 'A calendar view of your database', icon: CalendarIcon, keywords: ['calendar', 'date', 'schedule'] },
        { type: 'gallery', label: 'Gallery', description: 'Display database items as cards', icon: FolderIcon, keywords: ['gallery', 'cards', 'grid'] }
      ]
    },
    {
      category: 'Advanced',
      items: [
        { type: 'formula', label: 'Formula', description: 'Create calculations and formulas', icon: HashIcon, keywords: ['formula', 'calculation', 'math'] },
        { type: 'chart', label: 'Chart', description: 'Visualize data with charts', icon: BarChart3Icon, keywords: ['chart', 'graph', 'visualization'] },
        { type: 'map', label: 'Map', description: 'Embed a map location', icon: MapIcon, keywords: ['map', 'location', 'geography'] },
        { type: 'automation', label: 'Automation', description: 'Create automated workflows', icon: BoldIcon, keywords: ['automation', 'workflow', 'trigger'] },
        { type: 'mention', label: 'Mention', description: 'Mention a person or page', icon: AtSignIcon, keywords: ['mention', 'person', 'user'] }
      ]
    }
  ];

  const filteredBlocks = blockTypes.map(category => ({
    ...category,
    items: category.items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.label.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.keywords.some(keyword => keyword.includes(searchLower))
      );
    })
  })).filter(category => category.items.length > 0);

  const allFilteredItems = filteredBlocks.flatMap(category => category.items);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allFilteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allFilteredItems.length) % allFilteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFilteredItems[selectedIndex]) {
          onSelect(allFilteredItems[selectedIndex].type);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allFilteredItems, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-80 max-h-96 overflow-y-auto"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mb-2">
        <Input
          ref={searchRef}
          type="text"
          placeholder="Search for block types..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedIndex(0);
          }}
          className="h-8 text-sm"
        />
      </div>

      {filteredBlocks.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No blocks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBlocks.map((category, categoryIndex) => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {category.category}
              </h3>
              <div className="space-y-1">
                {category.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const globalIndex = allFilteredItems.findIndex(global => global.type === item.type);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <div
                      key={item.type}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => onSelect(item.type)}
                    >
                      <div className={`p-1 rounded ${isSelected ? 'bg-blue-200' : 'bg-gray-200'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to select
        </p>
      </div>
    </div>
  );
};

export default BlockMenu;