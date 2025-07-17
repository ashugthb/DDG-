// BrainVisualization.js - Fixed memory errors while preserving original logic

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { StatsOverlay, InactiveBrainOverlay } from '../styles/styledComponents';
import {
  createBrainColors,
  getActivityColorAndSize,
  ELECTRODE_POSITIONS,
  drawAdvancedContourMap,
  templateToScreen,
} from '../utils/brainUtils';

// Add maximum canvas dimensions to prevent memory issues
const MAX_CANVAS_WIDTH = 300;
const MAX_CANVAS_HEIGHT = 200;

// Single brain visualization component
const BrainVisualization = ({ 
  brainId, 
  brainData, 
  pulseTime, 
  showNoActivity,
  canvasRef: externalCanvasRef // Accept external canvas ref for fine-tuned control
}) => {
  // Create internal ref if no external ref is provided
  const internalCanvasRef = useRef(null);
  
  // Use the external ref if provided, otherwise use internal ref
  const canvasRef = externalCanvasRef || internalCanvasRef;
  
  const imagesRef = useRef({ template: null, outline: null });
  const offscreenCanvasRef = useRef(null);
  const containerRef = useRef(null);
  // Flag to track image loading
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Generate a unique color scheme for this brain
  const colors = useMemo(() => createBrainColors(brainId), [brainId]);
  
  // Extract data
  const isActive = brainData?.isActive || false;
  const channels = brainData?.channels || [];
  
  // Load images
  useEffect(() => {
    // Create offscreen canvas
    offscreenCanvasRef.current = document.createElement('canvas');
    
    // Load template image
    const templateImg = new Image();
    templateImg.src = '/images/template_150.png';
    templateImg.crossOrigin = 'anonymous'; // Handle CORS issues
    
    // Load outline image as mask
    const outlineImg = new Image();
    outlineImg.src = '/images/outline_300.png'; // Use your transparent outline
    outlineImg.crossOrigin = 'anonymous'; // Handle CORS issues
    
    // Set up onload handlers
    let loadedCount = 0;
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        setImagesLoaded(true);
      }
    };
    
    templateImg.onload = () => {
      imagesRef.current.template = templateImg;
      checkAllLoaded();
    };
    
    outlineImg.onload = () => {
      imagesRef.current.outline = outlineImg;
      checkAllLoaded();
    };
    
    // Handle error case for image loading
    templateImg.onerror = () => {
      console.error('Failed to load template image');
      checkAllLoaded(); // Continue anyway
    };
    
    outlineImg.onerror = () => {
      console.error('Failed to load outline image');
      checkAllLoaded(); // Continue anyway
    };
    
    return () => {
      // Cleanup
      offscreenCanvasRef.current = null;
      imagesRef.current.template = null;
      imagesRef.current.outline = null;
    };
  }, []);
  
  // Setup canvas size to match container but with max limits
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        // Get container size
        const { width, height } = container.getBoundingClientRect();
        
        // Apply maximum limits to prevent memory issues
        const canvasWidth = Math.min(width, MAX_CANVAS_WIDTH);
        const canvasHeight = Math.min(height, MAX_CANVAS_HEIGHT);
        
        // Set canvas size
        const canvas = canvasRef.current;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Trigger re-render with new size
        renderBrain();
      }
    };
    
    // Call once to set initial size
    resizeCanvas();
    
    // Set up resize observer for responsive canvas
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize to prevent too many redraws
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
      }
      window.resizeTimeout = setTimeout(resizeCanvas, 100);
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [canvasRef, imagesLoaded]);
  
  // Animate pulse for active channels
  const animatedChannels = useMemo(() => {
    if (!channels || channels.length === 0) return [];
    
    return channels.map(ch => {
      if (ch.changed) {
        // Animate activity up and down with pulseTime
        const anim = 0.5 + 0.5 * Math.sin(pulseTime * 4);
        return {
          ...ch,
          totalTransitions: ch.totalTransitions * (1 - anim) + ch.totalTransitions * 1.5 * anim,
        };
      }
      return ch;
    });
  }, [channels, pulseTime]);

  // OPTIMIZATION: Create a memoized rendering function
  const renderBrain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Skip rendering if canvas is too small
    if (width < 10 || height < 10) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    const bgGradient = ctx.createRadialGradient(
      width/2, height/2, 10, 
      width/2, height/2, height/1.5
    );
    bgGradient.addColorStop(0, 'rgba(10, 10, 30, 0.9)');
    bgGradient.addColorStop(1, 'rgba(5, 5, 15, 1.0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width , height); 
    
    // Brain dimensions
    const brainWidth = width * 0.8;
    const brainHeight = height * 0.8;
    
    try {
      // Draw advanced contour map with error handling
      drawAdvancedContourMap(
        ctx,
        animatedChannels,
        width,
        height,
        colors,
        imagesRef.current.outline,  // Use outline image for masking
        imagesRef.current.template, // Pass the template image as mask
        isActive,
      );
      
      // If not active, don't draw electrodes
      if (!isActive) {
        return;
      }
      
      // Draw electrodes with subtle effects
      const pulseValue = (Math.sin(pulseTime) + 1.0) * 0.5;
      
      // OPTIMIZATION: Batch draw electrodes by color for fewer state changes
      const electrodesToDraw = [];
      
      for (let channelId = 0; channelId < 24; channelId++) {
        const channel = animatedChannels.find(ch => ch.channel === channelId);
        let color, baseSize, size;
        
        if (channel) {
          const result = getActivityColorAndSize(channel, colors);
          color = result.color;
          baseSize = result.size;
          
          // Subtle pulse for active channels
          let pulseFactor;
          if (channel.changed) {
            pulseFactor = (Math.sin(pulseTime * 4) + 1.0) * 0.3 + 0.9; // Moderate pulse
          } else {
            pulseFactor = pulseValue * 0.1 + 0.95; // Minimal pulsing for non-changing electrodes
          }
          
          size = baseSize * pulseFactor;
        } else {
          color = [255, 255, 255];
          size = 2;
        }
        
        // Get electrode position
        const position = ELECTRODE_POSITIONS[channelId];
        if (!position) continue;

        const [x, y] = templateToScreen(position.x, position.y + 10, width, height);

        electrodesToDraw.push({
          x, y, size, color, 
          active: channel && channel.totalTransitions > 0,
          changing: channel && channel.changed
        });
      }
      
      // OPTIMIZATION: Draw all similar electrodes at once
      // Draw electrode glows for changing electrodes
      ctx.globalCompositeOperation = 'lighter';
      for (const electrode of electrodesToDraw) {
        if (electrode.active && electrode.changing) {
          const glowSize = electrode.size * 2;
          const glowGradient = ctx.createRadialGradient(electrode.x, electrode.y, 0, electrode.x, electrode.y, glowSize);
          glowGradient.addColorStop(0, `rgba(${electrode.color[0]}, ${electrode.color[1]}, ${electrode.color[2]}, 0.5)`);
          glowGradient.addColorStop(1, `rgba(${electrode.color[0]}, ${electrode.color[1]}, ${electrode.color[2]}, 0)`);
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(electrode.x, electrode.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw all electrode circles
      for (const electrode of electrodesToDraw) {
        ctx.fillStyle = `rgba(${electrode.color[0]}, ${electrode.color[1]}, ${electrode.color[2]}, 0.7)`;
        ctx.beginPath();
        ctx.arc(electrode.x, electrode.y, electrode.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw inner bright spots for active electrodes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (const electrode of electrodesToDraw) {
        if (electrode.active) {
          ctx.beginPath();
          ctx.arc(electrode.x, electrode.y, electrode.size/3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } catch (err) {
      // Fallback rendering if advanced rendering fails
      console.error('Error in brain rendering:', err);
      
      // Draw a simple brain outline
      ctx.strokeStyle = 'rgba(50, 100, 200, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(width/2, height/2, width/3, height/3, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add a warning for developers
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.font = '10px Arial';
      ctx.fillText('Render Error', width/2 - 30, height - 10);
    }
  }, [animatedChannels, colors, isActive, pulseTime, canvasRef]);
  
  // Use animation frame for rendering
  useEffect(() => {
    if (!canvasRef.current || !imagesLoaded) return;
    
    const animationFrame = requestAnimationFrame(renderBrain);
    return () => cancelAnimationFrame(animationFrame);
  }, [renderBrain, imagesLoaded]);
  
  // Calculate stats
  const activeChannels = channels.filter(ch => ch.totalTransitions > 0).length;
  const peakActivity = channels.length > 0 ? Math.max(...channels.map(ch => ch.totalTransitions), 0) : 0;
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
      />

      <StatsOverlay sx={{position: 'absolute', top: 17, left: 0, right: 0}}>
        Active: {activeChannels}/24 • Peak: {peakActivity}
      </StatsOverlay>
      
      {/* Show inactive overlay if brain is not active and showNoActivity is true */}
      {!isActive && showNoActivity && (
        <InactiveBrainOverlay>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main', mb: 5 }} />
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
              No Activity Detected
            </Typography>
          </Box>
        </InactiveBrainOverlay>
      )}
    </Box>
  );
};

export default BrainVisualization;