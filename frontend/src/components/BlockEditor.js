import React, { useState, useEffect, useRef } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../contexts/AuthContext';
import BlockComponent from './BlockComponent';
import BlockMenu from './BlockMenu';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';

const BlockEditor = ({ 
  content, 
  onChange, 
  canEdit, 
  pageId, 
  selectedBlocks, 
  setSelectedBlocks 
}) => {
  const { user } = useAuth();
  const { updateCursor, getCursorsForBlock } = useCollaboration();
  const [focusedBlock, setFocusedBlock] = useState(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const [newBlockIndex, setNewBlockIndex] = useState(null);
  const editorRef = useRef(null);

  const handleBlockChange = (blockId, newContent, properties = {}) => {
    const newBlocks = content.map(block => 
      block.id === blockId 
        ? { ...block, content: newContent, properties: { ...block.properties, ...properties } }
        : block
    );
    onChange(newBlocks);
  };

  const handleBlockTypeChange = (blockId, newType) => {
    const newBlocks = content.map(block => 
      block.id === blockId 
        ? { ...block, type: newType }
        : block
    );
    onChange(newBlocks);
  };

  const handleAddBlock = (index, type = 'paragraph') => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      properties: {}
    };
    
    const newBlocks = [...content];
    newBlocks.splice(index, 0, newBlock);
    onChange(newBlocks);
    
    // Focus the new block
    setTimeout(() => {
      setFocusedBlock(newBlock.id);
    }, 100);
  };

  const handleDeleteBlock = (blockId) => {
    const newBlocks = content.filter(block => block.id !== blockId);
    onChange(newBlocks);
  };

  const handleBlockFocus = (blockId) => {
    setFocusedBlock(blockId);
  };

  const handleBlockBlur = () => {
    setFocusedBlock(null);
  };

  const handleKeyDown = (e, blockId, index) => {
    if (!canEdit) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddBlock(index + 1);
    } else if (e.key === 'Backspace') {
      const block = content.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        handleDeleteBlock(blockId);
        // Focus previous block
        if (index > 0) {
          setFocusedBlock(content[index - 1].id);
        }
      }
    } else if (e.key === '/' && e.target.value === '') {
      e.preventDefault();
      setShowBlockMenu(true);
      setNewBlockIndex(index);
      const rect = e.target.getBoundingClientRect();
      setBlockMenuPosition({ x: rect.left, y: rect.bottom });
    }
  };

  const handleAddBlockClick = (index) => {
    setNewBlockIndex(index);
    setShowBlockMenu(true);
    const rect = editorRef.current?.getBoundingClientRect();
    setBlockMenuPosition({ 
      x: rect?.left || 0, 
      y: (rect?.top || 0) + (index * 60) 
    });
  };

  const handleBlockMenuSelect = (type) => {
    if (newBlockIndex !== null) {
      handleAddBlock(newBlockIndex, type);
    }
    setShowBlockMenu(false);
    setNewBlockIndex(null);
  };

  const handleCursorPosition = (blockId, position) => {
    updateCursor(blockId, position);
  };

  if (!content || content.length === 0) {
    return (
      <div className="space-y-4">
        {canEdit && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Start writing or press "/" for commands</p>
            <Button onClick={() => handleAddBlock(0)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add a block
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={editorRef} className="space-y-2">
      {content.map((block, index) => (
        <div key={block.id} className="group relative">
          {/* Block hover controls */}
          {canEdit && (
            <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleAddBlockClick(index)}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Real-time cursors */}
          <div className="absolute -top-1 left-0 right-0 h-1 pointer-events-none">
            {getCursorsForBlock(block.id).map((cursor) => (
              <div
                key={cursor.userId}
                className="absolute h-5 w-0.5 animate-pulse"
                style={{
                  backgroundColor: cursor.user.color,
                  left: `${Math.min(cursor.position, 100)}%`,
                  top: -2
                }}
              >
                <div 
                  className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded whitespace-nowrap"
                  style={{ backgroundColor: cursor.user.color }}
                >
                  {cursor.user.name}
                </div>
              </div>
            ))}
          </div>

          <BlockComponent
            block={block}
            onChange={(content, properties) => handleBlockChange(block.id, content, properties)}
            onTypeChange={(type) => handleBlockTypeChange(block.id, type)}
            onDelete={() => handleDeleteBlock(block.id)}
            onFocus={() => handleBlockFocus(block.id)}
            onBlur={handleBlockBlur}
            onKeyDown={(e) => handleKeyDown(e, block.id, index)}
            onCursorMove={(position) => handleCursorPosition(block.id, position)}
            canEdit={canEdit}
            isFocused={focusedBlock === block.id}
            isSelected={selectedBlocks.has(block.id)}
            pageId={pageId}
          />
        </div>
      ))}

      {/* Add block at the end */}
      {canEdit && (
        <div className="group relative">
          <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleAddBlockClick(content.length)}
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div 
            className="h-8 border-l-2 border-transparent hover:border-gray-300 cursor-pointer"
            onClick={() => handleAddBlock(content.length)}
          />
        </div>
      )}

      {/* Block Menu */}
      {showBlockMenu && (
        <BlockMenu
          position={blockMenuPosition}
          onSelect={handleBlockMenuSelect}
          onClose={() => {
            setShowBlockMenu(false);
            setNewBlockIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default BlockEditor;