import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  MaximizeIcon, 
  RotateCcwIcon 
} from 'lucide-react';

const ZoomControls = ({ 
  zoom, 
  onZoomChange, 
  onFitToScreen, 
  onResetZoom,
  className = '',
  position = 'bottom-left' // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const zoomLevels = [
    10, 25, 50, 75, 90, 100, 125, 150, 175, 200, 250, 300, 400, 500
  ];

  const handleZoomIn = useCallback(() => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    onZoomChange(zoomLevels[nextIndex]);
  }, [zoom, onZoomChange, zoomLevels]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange(zoomLevels[prevIndex]);
  }, [zoom, onZoomChange, zoomLevels]);

  const handleZoomSelect = (value) => {
    onZoomChange(parseInt(value));
    setIsOpen(false);
  };

  const canZoomIn = zoom < zoomLevels[zoomLevels.length - 1];
  const canZoomOut = zoom > zoomLevels[0];

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        return 'bottom-4 left-4';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Plus: Zoom In
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (canZoomIn) handleZoomIn();
      }
      
      // Ctrl/Cmd + Minus: Zoom Out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (canZoomOut) handleZoomOut();
      }
      
      // Ctrl/Cmd + 0: Reset Zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onResetZoom();
      }
      
      // Ctrl/Cmd + 1: Fit to Screen
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        onFitToScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canZoomIn, canZoomOut, handleZoomIn, handleZoomOut, onResetZoom, onFitToScreen]);

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-40 flex items-center space-x-1 ${className}`}
    >
      {/* Zoom Controls Background Panel */}
      <div className="flex items-center bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-2 py-1.5">
        {/* Zoom Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          className="h-7 w-7 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out (Ctrl/Cmd + -)"
        >
          <ZoomOutIcon className="h-3.5 w-3.5" />
        </Button>

        {/* Zoom Percentage Display */}
        <div className="relative">
          <Select
            open={isOpen}
            onOpenChange={setIsOpen}
            value={zoom.toString()}
            onValueChange={handleZoomSelect}
          >
            <SelectTrigger className="h-7 w-16 text-xs font-medium border-none shadow-none hover:bg-gray-100 focus:ring-0 px-1">
              <SelectValue>
                {Math.round(zoom)}%
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="top" className="w-20 max-h-48">
              {zoomLevels.map((level) => (
                <SelectItem key={level} value={level.toString()} className="text-xs">
                  {level}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zoom In Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          className="h-7 w-7 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In (Ctrl/Cmd + +)"
        >
          <ZoomInIcon className="h-3.5 w-3.5" />
        </Button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Fit to Screen Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitToScreen}
          className="h-7 w-7 p-0 hover:bg-gray-100"
          title="Fit to Screen (Ctrl/Cmd + 1)"
        >
          <MaximizeIcon className="h-3.5 w-3.5" />
        </Button>

        {/* Reset Zoom Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetZoom}
          className="h-7 w-7 p-0 hover:bg-gray-100"
          title="Reset Zoom (Ctrl/Cmd + 0)"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ZoomControls;