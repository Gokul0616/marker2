import React, { useState, useRef, useEffect } from 'react';
import { useNotion } from '../contexts/NotionContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SearchIcon, FileTextIcon, DatabaseIcon } from 'lucide-react';

const SearchBar = () => {
  const { searchQuery, setSearchQuery, searchResults } = useNotion();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      if (isOpen && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % searchResults.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Handle selection
          const selected = searchResults[selectedIndex];
          if (selected) {
            console.log('Selected:', selected);
            setIsOpen(false);
            setSearchQuery('');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, setSearchQuery]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(0);
  };

  const handleInputFocus = () => {
    setIsOpen(searchQuery.length > 0);
  };

  const handleInputBlur = () => {
    // Delay closing to allow click events
    setTimeout(() => setIsOpen(false), 200);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'page':
        return <FileTextIcon className="h-4 w-4" />;
      case 'database':
        return <DatabaseIcon className="h-4 w-4" />;
      default:
        return <FileTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search pages, databases..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-20 w-80"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Badge variant="secondary" className="text-xs">
            ⌘K
          </Badge>
        </div>
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">RESULTS</div>
            {searchResults.map((result, index) => (
              <div
                key={result.id}
                className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                  index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  console.log('Clicked:', result);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              >
                <div className="flex-shrink-0">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && searchQuery.length > 0 && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="text-center text-gray-500">
            <SearchIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No results found for "{searchQuery}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;