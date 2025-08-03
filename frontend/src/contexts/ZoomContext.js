import React, { createContext, useContext } from 'react';
import useZoom from '../hooks/useZoom';

const ZoomContext = createContext();

export const useZoomContext = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoomContext must be used within a ZoomProvider');
  }
  return context;
};

export const ZoomProvider = ({ children, ...zoomOptions }) => {
  const zoomState = useZoom(100, {
    minZoom: 10,
    maxZoom: 500,
    zoomStep: 25,
    wheelZoomSensitivity: 2,
    enableWheelZoom: true,
    enablePinchZoom: true,
    smoothZoom: true,
    ...zoomOptions
  });

  return (
    <ZoomContext.Provider value={zoomState}>
      {children}
    </ZoomContext.Provider>
  );
};

export default ZoomContext;