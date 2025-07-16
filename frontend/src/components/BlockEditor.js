import React, { useState, useEffect, useRef } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useAuth } from '../contexts/AuthContext';
import BlockComponent from './BlockComponent';
import BlockMenu from './BlockMenu';
import { Button } from './ui/button';
import { PlusIcon, TypeIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [draggedBlock, setDraggedBlock] = useState(null);
  const editorRef = useRef(null);

  // Ensure content is valid
  const validContent = Array.isArray(content) ? content : [];

  useEffect(() => {
    // Auto-focus first block if empty
    if (validContent.length === 0 && canEdit) {
      handleAddBlock(0);
    }
  }, [validContent.length, canEdit]);

  const handleBlockChange = (blockId, newContent, properties = {}) => {
    if (!canEdit) {
      toast.error('You don\'t have permission to edit this page');
      return;
    }

    try {
      const newBlocks = validContent.map(block => 
        block.id === blockId 
          ? { ...block, content: newContent, properties: { ...block.properties, ...properties } }
          : block
      );
      onChange(newBlocks);
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block');
    }
  };

  const handleBlockTypeChange = (blockId, newType) => {
    if (!canEdit) {
      toast.error('You don\'t have permission to edit this page');
      return;
    }

    try {
      const newBlocks = validContent.map(block => 
        block.id === blockId 
          ? { ...block, type: newType }
          : block
      );
      onChange(newBlocks);
    } catch (error) {
      console.error('Error changing block type:', error);
      toast.error('Failed to change block type');
    }
  };

  const handleAddBlock = (index, type = 'paragraph') => {
    if (!canEdit) {
      toast.error('You don\'t have permission to edit this page');
      return;
    }

    try {
      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: '',
        properties: {}
      };
      
      const newBlocks = [...validContent];
      newBlocks.splice(index, 0, newBlock);
      onChange(newBlocks);
      
      // Focus the new block
      setTimeout(() => {
        setFocusedBlock(newBlock.id);
      }, 100);
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block');
    }
  };

  const handleDeleteBlock = (blockId) => {
    if (!canEdit) {
      toast.error('You don\'t have permission to edit this page');
      return;
    }

    try {
      const newBlocks = validContent.filter(block => block.id !== blockId);
      onChange(newBlocks);
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block');
    }
  };

  const handleDuplicateBlock = (blockId) => {
    if (!canEdit) {
      toast.error('You don\'t have permission to edit this page');
      return;
    }

    try {
      const blockIndex = validContent.findIndex(b => b.id === blockId);
      const block = validContent[blockIndex];
      
      const duplicatedBlock = {
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      const newBlocks = [...validContent];
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      onChange(newBlocks);
    } catch (error) {
      console.error('Error duplicating block:', error);
      toast.error('Failed to duplicate block');
    }
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
      const block = validContent.find(b => b.id === blockId);
      if (block && block.content === '' && validContent.length > 1) {
        e.preventDefault();
        handleDeleteBlock(blockId);
        // Focus previous block
        if (index > 0) {
          setFocusedBlock(validContent[index - 1].id);
        }
      }
    } else if (e.key === '/' && e.target.value === '/') {
      e.preventDefault();
      setShowBlockMenu(true);
      setNewBlockIndex(index);
      const rect = e.target.getBoundingClientRect();
      setBlockMenuPosition({ x: rect.left, y: rect.bottom });
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      setFocusedBlock(validContent[index - 1].id);
    } else if (e.key === 'ArrowDown' && index < validContent.length - 1) {
      e.preventDefault();
      setFocusedBlock(validContent[index + 1].id);
    }
  };

  const handleAddBlockClick = (index) => {
    if (!canEdit) return;
    
    setNewBlockIndex(index);
    setShowBlockMenu(true);
    setBlockMenuPosition({ x: 100, y: 100 });
  };

  const handleBlockMenuSelect = (type) => {
    if (newBlockIndex !== null) {
      handleAddBlock(newBlockIndex, type);
    }
    setShowBlockMenu(false);
    setNewBlockIndex(null);
  };

  const handleDragStart = (e, blockId) => {
    if (!canEdit) return;
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (!draggedBlock || !canEdit) return;

    const draggedIndex = validContent.findIndex(b => b.id === draggedBlock);
    if (draggedIndex === dropIndex) return;

    const newBlocks = [...validContent];
    const [draggedBlockData] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlockData);
    
    onChange(newBlocks);
    setDraggedBlock(null);
  };

  if (!canEdit && validContent.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <TypeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">This page is empty</p>
          <p className="text-gray-400 text-sm">You don't have permission to edit this page</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="space-y-2">
      {validContent.map((block, index) => (
        <div
          key={block.id}
          className="group relative"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <BlockComponent
            block={block}
            onChange={(content, properties) => handleBlockChange(block.id, content, properties)}
            onTypeChange={(type) => handleBlockTypeChange(block.id, type)}
            onDelete={() => handleDeleteBlock(block.id)}
            onDuplicate={() => handleDuplicateBlock(block.id)}
            onFocus={() => handleBlockFocus(block.id)}
            onBlur={handleBlockBlur}
            onKeyDown={(e) => handleKeyDown(e, block.id, index)}
            onDragStart={(e) => handleDragStart(e, block.id)}
            canEdit={canEdit}
            isFocused={focusedBlock === block.id}
            isSelected={selectedBlocks.has(block.id)}
            pageId={pageId}
          />
          
          {/* Add Block Button */}
          {canEdit && (
            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddBlockClick(index + 1)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 h-8 w-8"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
      
      {/* Empty State */}
      {validContent.length === 0 && canEdit && (
        <div 
          className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => handleAddBlock(0)}
        >
          <div className="text-center">
            <TypeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Start writing...</p>
            <p className="text-gray-400 text-sm">Click here or type / to add content</p>
          </div>
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