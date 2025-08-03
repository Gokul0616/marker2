import { useState, useCallback, useEffect, useRef } from 'react';

const useZoom = (initialZoom = 100, options = {}) => {
  const {
    minZoom = 10,
    maxZoom = 500,
    zoomStep = 10,
    wheelZoomSensitivity = 0.1,
    enableWheelZoom = true,
    enablePinchZoom = true,
    smoothZoom = true,
  } = options;

  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const lastPinchDistance = useRef(null);

  const clampZoom = useCallback((value) => {
    return Math.max(minZoom, Math.min(maxZoom, value));
  }, [minZoom, maxZoom]);

  const handleZoomChange = useCallback((newZoom, centerPoint = null) => {
    const clampedZoom = clampZoom(newZoom);
    
    if (centerPoint && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Calculate the zoom center relative to the container
      const centerX = centerPoint.x - rect.left;
      const centerY = centerPoint.y - rect.top;
      
      // Calculate the new offset to maintain the zoom center
      const zoomRatio = clampedZoom / zoom;
      const newOffsetX = centerX - (centerX - viewportOffset.x) * zoomRatio;
      const newOffsetY = centerY - (centerY - viewportOffset.y) * zoomRatio;
      
      setViewportOffset({ x: newOffsetX, y: newOffsetY });
    }
    
    setZoom(clampedZoom);
  }, [zoom, clampZoom, viewportOffset]);

  const zoomIn = useCallback((centerPoint = null) => {
    handleZoomChange(zoom + zoomStep, centerPoint);
  }, [zoom, zoomStep, handleZoomChange]);

  const zoomOut = useCallback((centerPoint = null) => {
    handleZoomChange(zoom - zoomStep, centerPoint);
  }, [zoom, zoomStep, handleZoomChange]);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setViewportOffset({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    
    const scaleX = containerRect.width / contentRect.width;
    const scaleY = containerRect.height / contentRect.height;
    const optimalZoom = Math.min(scaleX, scaleY) * 90; // 90% to add some padding
    
    const clampedZoom = clampZoom(optimalZoom);
    
    // Center the content
    const newOffsetX = (containerRect.width - contentRect.width * (clampedZoom / 100)) / 2;
    const newOffsetY = (containerRect.height - contentRect.height * (clampedZoom / 100)) / 2;
    
    setZoom(clampedZoom);
    setViewportOffset({ x: newOffsetX, y: newOffsetY });
  }, [clampZoom]);

  const handleWheel = useCallback((e) => {
    if (!enableWheelZoom) return;
    
    // Check if Ctrl/Cmd is held (for zoom) or just scroll
    if (!(e.ctrlKey || e.metaKey)) return;
    
    e.preventDefault();
    
    const delta = -e.deltaY * wheelZoomSensitivity;
    const newZoom = zoom + delta;
    
    handleZoomChange(newZoom, { x: e.clientX, y: e.clientY });
  }, [enableWheelZoom, zoom, wheelZoomSensitivity, handleZoomChange]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 1 && !(e.button === 0 && e.shiftKey)) return; // Middle mouse or Shift+Left click
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewportOffset.x, y: e.clientY - viewportOffset.y });
  }, [viewportOffset]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    setViewportOffset(newOffset);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handling for pinch-to-zoom
  const handleTouchStart = useCallback((e) => {
    if (!enablePinchZoom || e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
    
    lastPinchDistance.current = distance;
  }, [enablePinchZoom]);

  const handleTouchMove = useCallback((e) => {
    if (!enablePinchZoom || e.touches.length !== 2 || !lastPinchDistance.current) return;
    
    e.preventDefault();
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
    
    const scale = distance / lastPinchDistance.current;
    const newZoom = zoom * scale;
    
    // Calculate center point between fingers
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    handleZoomChange(newZoom, { x: centerX, y: centerY });
    lastPinchDistance.current = distance;
  }, [enablePinchZoom, zoom, handleZoomChange]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  // Event listeners setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    
    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Global mouse events for dragging
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    handleWheel, 
    handleMouseDown, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd,
    handleMouseMove,
    handleMouseUp,
    isDragging
  ]);

  // Transform styles for the content
  const transformStyle = {
    transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${zoom / 100})`,
    transformOrigin: '0 0',
    transition: smoothZoom && !isDragging ? 'transform 0.2s ease-out' : 'none',
  };

  return {
    zoom,
    viewportOffset,
    isDragging,
    containerRef,
    contentRef,
    transformStyle,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleZoomChange,
    canZoomIn: zoom < maxZoom,
    canZoomOut: zoom > minZoom,
  };
};

export default useZoom;