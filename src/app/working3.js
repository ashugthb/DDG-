'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  AppBar, 
  Toolbar, 
  Container, 
  CssBaseline,
  ThemeProvider, 
  createTheme,
  alpha,
  Menu,
  MenuItem,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Switch,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import BrainIcon from '@mui/icons-material/Psychology';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Create a professional dark theme for the application
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00b4ff',
    },
    secondary: {
      main: '#00ff64',
    },
    background: {
      default: '#050510',
      paper: '#10102a',
    },
    text: {
      primary: '#e0e0fa',
      secondary: '#a0a0c0',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 300,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 400,
        },
      },
    },
  },
});

// Styled components
const BrainCell = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(1),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 25px rgba(0, 20, 80, 0.5)',
    transform: 'translateY(-2px)',
  }
}));

const AppContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  background: 'linear-gradient(to bottom, #050518 0%, #0a0a2a 100%)',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  background: 'linear-gradient(90deg, rgba(10,10,40,0.8) 0%, rgba(20,20,60,0.8) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(80,80,150,0.2)',
}));

const FooterBar = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(0.8),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  borderTop: '1px solid rgba(80,80,150,0.1)',
}));

const StatsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 4,
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
}));

const HeaderButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  backdropFilter: 'blur(5px)',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  }
}));

const ColorScaleLegend = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 16,
  top: 80,
  width: 28,
  height: 160,
  background: 'linear-gradient(to top, #00f 0%, #0ff 20%, #0f0 40%, #ff0 60%, #f80 80%, #f00 100%)',
  borderRadius: 8,
  border: '1px solid rgba(80,80,150,0.3)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 10,
  pointerEvents: 'none'
}));

const InfoPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: 80,
  right: 60,
  width: 320,
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  borderRadius: theme.shape.borderRadius * 1.5,
  maxHeight: 'calc(100vh - 160px)',
  overflowY: 'auto',
  transform: 'translateX(110%)',
  transition: 'transform 0.3s ease-in-out',
  '&.visible': {
    transform: 'translateX(0)',
  }
}));

const ControlButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.secondary.main, 0.2),
  }
}));

const ActivityIndicator = styled(Box)(({ theme, $active }) => ({
  display: 'inline-block',
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: $active ? theme.palette.success.main : theme.palette.error.main,
  marginRight: 8,
  boxShadow: $active ? '0 0 8px rgba(0, 255, 0, 0.5)' : 'none',
}));

const DetailCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
  }
}));

const InactiveBrainOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  borderRadius: theme.shape.borderRadius * 1.5,
  zIndex: 10,
}));

// Enhanced colormap specifically for transitions
// Focus on showing high transitions as red, with a gradual transition
const COLORMAP = [
  [0, 0, 255],     // Blue (low activity)
  [0, 255, 255],   // Cyan
  [0, 255, 0],     // Green
  [255, 255, 0],   // Yellow
  [255, 128, 0],   // Orange
  [255, 0, 0]      // Red (high activity)
];

// Helper: interpolate between two colors
function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

// HSV to RGB conversion for brain color scheme generation
function hsvToRgb(h, s, v) {
  // Increase saturation for more vibrant colors
  s = Math.min(1.0, s * 1.2);
  
  let r, g, b;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

// Create colors for each brain
function createBrainColors(brainId) {
  // Create 12 distinct color schemes with hue variations
  const hueShift = (brainId * 30) % 360; // 30 degrees hue difference between brains
  
  // Convert hue to RGB for the accent color
  const accentColor = hsvToRgb(hueShift / 360, 0.8, 1.0);
  
  // Create a custom color scheme based on the accent
  return {
    background: [5, 5, 15],
    brainOutline: accentColor,
    brainFill: [20, 25, 35],
    inactive: [50, 50, 70],         // Darker inactive electrodes
    lowActivity: [0, 0, 255],       // Blue for low activity
    mediumActivity: [0, 255, 0],    // Green for medium activity
    highActivity: [255, 0, 0],      // Red for high activity
    changing: [255, 150, 255],      // Lighter magenta for changing electrodes
    grid: [40, 40, 60],
    accent: accentColor,
    textBright: [255, 255, 255],
    textDim: [150, 150, 170]
  };
}

// Get color and size based on channel activity level
function getActivityColorAndSize(channel, colors) {
  if (!channel || channel.totalTransitions === 0) {
    return { color: colors.inactive, size: 2 };
  }
  
  // Determine color based on activity level
  // Ensure high transitions show as red
  if (channel.totalTransitions > 100) {
    return { color: colors.highActivity, size: 4 }; // Red for high activity
  } else if (channel.totalTransitions > 50) {
    return { color: colors.mediumActivity, size: 3.5 }; // Green for medium
  } else if (channel.totalTransitions > 10) {
    return { color: colors.lowActivity, size: 3 }; // Blue for low
  } else {
    return { color: colors.inactive, size: 2.5 }; // Gray for minimal
  }
}

// OPTIMIZATION: Pre-computed electrode positions to avoid recalculating
const ELECTRODE_POSITIONS = {
  // Left hemisphere (A electrodes)
  0: { name: "A0", x: 31, y: 31 },
  1: { name: "A1", x: 37, y: 29 },
  2: { name: "A2", x: 45, y: 38 },
  3: { name: "A3", x: 42, y: 38 },
  4: { name: "A4", x: 42, y: 48 },
  5: { name: "A5", x: 50, y: 56 },
  6: { name: "A6", x: 43, y: 57 },
  7: { name: "A7", x: 45, y: 71 },
  8: { name: "A8", x: 24, y: 32 },
  9: { name: "A9", x: 35, y: 28 },
  10: { name: "A10", x: 40, y: 38 },
  11: { name: "A11", x: 45, y: 42 },
  // Right hemisphere (B electrodes)
  12: { name: "B0", x: 24, y: 37 },
  13: { name: "B1", x: 32, y: 75 },
  14: { name: "B2", x: 24, y: 41 },
  15: { name: "B3", x: 27, y: 45 },
  16: { name: "B4", x: 24, y: 69 },
  17: { name: "B5", x: 26, y: 56 },
  18: { name: "B6", x: 38, y: 76 },
  19: { name: "B7", x: 28, y: 51 },
  20: { name: "B8", x: 23, y: 42 },
  21: { name: "B9", x: 19, y: 47 },
  22: { name: "B10", x: 25, y: 60 },
  23: { name: "B11", x: 26, y: 72 },
};

// Template bounds
const TEMPLATE_MIN_X = 12;
const TEMPLATE_MAX_X = 55;
const TEMPLATE_MIN_Y = 24;
const TEMPLATE_MAX_Y = 86;

// Convert template coordinates to screen coordinates
function templateToScreen(templateX, templateY, width, height) {
  const brainWidth = width * 0.8;
  const brainHeight = height * 0.8;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Normalize template coordinates
  const normX = (templateX - TEMPLATE_MIN_X) / (TEMPLATE_MAX_X - TEMPLATE_MIN_X);
  const normY = (templateY - TEMPLATE_MIN_Y) / (TEMPLATE_MAX_Y - TEMPLATE_MIN_Y);
  
  // Convert to screen coordinates
  const screenX = centerX - brainWidth / 2 + normX * brainWidth;
  const screenY = centerY - brainHeight / 2 + normY * brainHeight;
  
  return [screenX, screenY];
}

// Function to parse the logic data file
async function parseLogicData(filePath) {
  try {
    const response = await fetch(filePath + '?t=' + new Date().getTime(), {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.error('Empty response from logic data file');
      return null;
    }
    
    const lines = text.trim().split('\n');
    
    // Parse data from the file
    const brainData = [];
    let currentBrainId = -1;
    let currentBrain = null;
    
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') {
        // Skip comments and empty lines
        continue;
      }
      
      const parts = line.trim().split(',');
      
      if (parts[0] === 'DEVICE') {
        // Start of a new device/brain
        if (currentBrain !== null) {
          brainData.push(currentBrain);
        }
        
        currentBrainId = parseInt(parts[1]);
        currentBrain = {
          id: currentBrainId,
          serialNumber: parts[2],
          model: parts[3],
          captureCount: parseInt(parts[4]),
          channels: [],
          isActive: false  // Will be set to true if any channels are active
        };
      } else if (parts[0] === 'CHANNEL' && currentBrain !== null) {
        // Channel data for current brain
        const channelId = parseInt(parts[1]);
        const channelName = parts[2];
        const currentState = parseInt(parts[3]);
        const transitions = parseInt(parts[4]);
        const totalTransitions = parseInt(parts[5]);
        const activityLevel = parseInt(parts[6]); // 0-100 activity level
        
        // Store channel data
        currentBrain.channels.push({
          channel: channelId,
          name: channelName,
          currentState: currentState,
          transitions: transitions,
          totalTransitions: totalTransitions,
          activityLevel: activityLevel,
          changed: activityLevel > 0  // Mark as changed if activity level > 0
        });
        
        // If any channel has activity, mark the brain as active
        if (transitions > 0 || totalTransitions > 0) {
          currentBrain.isActive = true;
        }
      }
    }
    
    // Add the last brain if it exists
    if (currentBrain !== null) {
      brainData.push(currentBrain);
    }
    
    return brainData;
  } catch (error) {
    console.error('Error parsing logic data:', error);
    return null;
  }
}

// Get brain data for a specific brain from parsed data
function getBrainData(brainData, brainId) {
  if (!brainData || brainData.length === 0) {
    return null;
  }
  
  // Find the brain with matching ID
  const brain = brainData.find(b => b.id === brainId);
  
  if (!brain) {
    // If brain not found in data, return null to indicate inactive brain
    return null;
  }
  
  return {
    id: brain.id,
    serialNumber: brain.serialNumber,
    model: brain.model,
    captureCount: brain.captureCount,
    isActive: brain.isActive,
    channels: brain.channels
  };
}

// OPTIMIZATION: Pre-compute and cache brain mask
const brainMaskCache = new Map();
function getBrainMask(gridSize) {
  if (brainMaskCache.has(gridSize)) {
    return brainMaskCache.get(gridSize);
  }
  
  const mask = Array(gridSize).fill().map(() => Array(gridSize).fill(1));
  
  // Create an elliptical mask
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;
  const radiusX = gridSize * 0.4;
  const radiusY = gridSize * 0.45;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Determine if this point is outside the ellipse
      if (((i - centerX) / radiusX) ** 2 + ((j - centerY) / radiusY) ** 2 > 1) {
        mask[j][i] = NaN;
      }
    }
  }
  
  brainMaskCache.set(gridSize, mask);
  return mask;
}

// OPTIMIZATION: More efficient contour plotting function
function drawAdvancedContourMap(ctx, channels, width, height, colors, outlineImg, isActive) {
  const centerX = width / 2;
  const centerY = height / 2;
  const brainWidth = width * 0.8;
  const brainHeight = height * 0.8;
  
  // If brain is not active, just draw the outline with minimal intensity
  if (!isActive || !channels || channels.length === 0) {
    // Draw brain outline with low intensity
    const brainX = centerX - brainWidth / 2;
    const brainY = centerY - brainHeight / 2 + 10;
    
    if (outlineImg && outlineImg.complete) {
      ctx.globalAlpha = 0.3; // Low opacity for inactive brain
      ctx.drawImage(outlineImg, brainX, brainY, brainWidth, brainHeight);
      ctx.globalAlpha = 1.0;
    }
    return;
  }
  
  // OPTIMIZATION: Reduced grid size for better performance while maintaining visuals
  const gridSize = 60;
  
  // Get brain mask from cache
  const brainMask = getBrainMask(gridSize);
  
  // Normalize to 0-4 range for contour plotting
  const xdiff = TEMPLATE_MAX_X - TEMPLATE_MIN_X;
  const ydiff = TEMPLATE_MAX_Y - TEMPLATE_MIN_Y;
  
  // Extract electrode data
  const x = [];
  const y = [];
  const z = [];
  
  // Calculate average activity for background level
  let avgActivity = 0;
  let activeCount = 0;
  
  // OPTIMIZATION: Collect data only from active electrodes
  for (const channel of channels) {
    const electrode = ELECTRODE_POSITIONS[channel.channel];
    if (!electrode) continue;
    
    // Normalize coordinates to 0-4 range
    const normX = ((electrode.x - TEMPLATE_MIN_X) / xdiff) * 4;
    // Flip y-axis for consistency with Python code
    const normY = 4 - ((electrode.y - TEMPLATE_MIN_Y) / ydiff) * 4;
    
    // Activity level from transitions (normalized)
    let activity;
    if (channel.totalTransitions > 0) {
      // Enhanced activity level for stronger visualization
      // Scale to ensure high transitions are shown as red
      activity = Math.min(1.0, channel.totalTransitions / 150.0) * 3.0 + 0.5;
      avgActivity += activity;
      activeCount += 1;
    } else {
      activity = 0.2; // Baseline activity
    }
    
    x.push(normX);
    y.push(normY);
    z.push(activity);
  }
  
  // If no active electrodes, return
  if (x.length === 0) return;
  
  // Calculate average activity for corner points
  if (activeCount > 0) {
    avgActivity /= activeCount;
  } else {
    avgActivity = 0.2; // Baseline
  }
  
  // Add corner points to improve interpolation at edges
  // OPTIMIZATION: Only use 4 corner points instead of 8
  const corners = [
    [0, 0], [0, 4], [4, 0], [4, 4]
  ];
  
  for (const [cx, cy] of corners) {
    x.push(cx);
    y.push(cy);
    z.push(avgActivity * 0.8); // Slightly reduce activity at edges
  }
  
  // OPTIMIZATION: Use typed arrays for better performance
  const zi = new Float32Array(gridSize * gridSize);
  
  // OPTIMIZATION: Simplified distance calculation with lookup tables
  const gxValues = new Float32Array(gridSize);
  const gyValues = new Float32Array(gridSize);
  
  for (let i = 0; i < gridSize; i++) {
    gxValues[i] = i / gridSize * 4;
    gyValues[i] = i / gridSize * 4;
  }
  
  // OPTIMIZATION: Reuse distance array
  const distances = new Float32Array(x.length);
  const weights = new Float32Array(x.length);
  
  // Simple inverse distance weighting interpolation
  for (let j = 0; j < gridSize; j++) {
    const gy = gyValues[j];
    
    for (let i = 0; i < gridSize; i++) {
      const index = j * gridSize + i;
      
      // Skip if outside the brain mask
      if (isNaN(brainMask[j][i])) {
        zi[index] = NaN;
        continue;
      }
      
      const gx = gxValues[i];
      
      let weightSum = 0;
      let valueSum = 0;
      
      // Calculate distances to all known points
      let foundExactMatch = false;
      
      for (let k = 0; k < x.length; k++) {
        // OPTIMIZATION: More efficient distance calculation
        const dx = gx - x[k];
        const dy = gy - y[k];
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.0001) {
          // Very close to a known point
          zi[index] = z[k];
          foundExactMatch = true;
          break;
        }
        
        distances[k] = dist;
        // Modified power for stronger interpolation effect
        const weight = 1 / (dist * dist);
        weights[k] = weight;
        weightSum += weight;
        valueSum += z[k] * weight;
      }
      
      if (!foundExactMatch && weightSum > 0) {
        zi[index] = valueSum / weightSum;
      }
    }
  }
  
  // Find min/max for normalization
  let ziMin = Infinity;
  let ziMax = -Infinity;
  
  for (let i = 0; i < zi.length; i++) {
    if (!isNaN(zi[i])) {
      ziMin = Math.min(ziMin, zi[i]);
      ziMax = Math.max(ziMax, zi[i]);
    }
  }
  
  // Apply contrast enhancement
  const contrast = 2.0; // Stronger contrast
  const ziRange = Math.max(0.1, ziMax - ziMin); // Avoid division by zero
  
  // Create a temporary canvas for the contour
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = gridSize;
  tempCanvas.height = gridSize;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  // OPTIMIZATION: Create a single ImageData for the entire contour
  const imageData = tempCtx.createImageData(gridSize, gridSize);
  const data = imageData.data;
  
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      const index = j * gridSize + i;
      const pixelIndex = (j * gridSize + i) * 4;
      
      if (isNaN(zi[index])) {
        // Set transparent pixel for areas outside the brain
        data[pixelIndex + 3] = 0;
        continue;
      }
      
      // Normalize value to 0-1 range with contrast enhancement
      const normalizedVal = (zi[index] - ziMin) / ziRange;
      
      // Apply contrast enhancement
      let val = 0.5 + (normalizedVal - 0.5) * contrast;
      val = Math.max(0, Math.min(1, val)); // Clamp to 0-1
      
      // --- SMOOTH COLOR INTERPOLATION ---
      const scaled = val * (COLORMAP.length - 1);
      const idx = Math.floor(scaled);
      const frac = scaled - idx;
      const colorA = COLORMAP[idx];
      const colorB = COLORMAP[Math.min(idx + 1, COLORMAP.length - 1)];
      const color = lerpColor(colorA, colorB, frac);

      // Set pixel color
      data[pixelIndex] = color[0];
      data[pixelIndex + 1] = color[1];
      data[pixelIndex + 2] = color[2];
      data[pixelIndex + 3] = Math.min(255, 180 + val * 75); // More vivid alpha
    }
  }
  
  // Put image data to temp canvas
  tempCtx.putImageData(imageData, 0, 0);
  
  // Create a canvas for the masked result
  const brainX = centerX - brainWidth / 2;
  // Shift the visualization down by 10px as requested
  const brainY = centerY - brainHeight / 2 + 10;
  
  // Properly handle masking with the brain outline image
  if (outlineImg && outlineImg.complete) {
    // Create a canvas for the mask processing
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = brainWidth;
    maskCanvas.height = brainHeight;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    
    // Step 1: Draw the mask image (which has transparent brain and black outside)
    maskCtx.drawImage(outlineImg, 0, 0, brainWidth, brainHeight);
    
    // Step 2: Extract the alpha channel to create our mask
    const maskData = maskCtx.getImageData(0, 0, brainWidth, brainHeight);
    const maskPixels = maskData.data;
    
    // Step 3: Invert the mask - we want to keep pixels where the brain image is transparent
    // and discard pixels where the brain image is black
    for (let i = 0; i < maskPixels.length; i += 4) {
      // If pixel is black (outside the brain)
      if (maskPixels[i] === 0 && maskPixels[i+1] === 0 && maskPixels[i+2] === 0 && maskPixels[i+3] === 255) {
        // Make it transparent (we'll discard this)
        maskPixels[i+3] = 0;
      } else {
        // Otherwise make it fully opaque (we'll keep this)
        maskPixels[i] = 255;
        maskPixels[i+1] = 255;
        maskPixels[i+2] = 255;
        maskPixels[i+3] = 255;
      }
    }
    
    // Put the inverted mask back
    maskCtx.putImageData(maskData, 0, 0);
    
    // Step 4: Clear the canvas and redraw using the mask
    maskCtx.globalCompositeOperation = 'source-in';
    
    // Step 5: Draw our contour data onto the mask
    maskCtx.drawImage(tempCanvas, 0, 0, brainWidth, brainHeight);
    
    // Step 6: Draw the final masked result to the main canvas
    ctx.drawImage(maskCanvas, brainX, brainY);
    
    // Optional: Draw a subtle brain outline
    ctx.strokeStyle = `rgba(${colors.brainOutline[0]}, ${colors.brainOutline[1]}, ${colors.brainOutline[2]}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.drawImage(outlineImg, brainX, brainY, brainWidth, brainHeight);
  } else {
    // Fallback if outline image is not available
    ctx.drawImage(tempCanvas, brainX, brainY, brainWidth, brainHeight);
  }
}

// Single brain visualization component
function BrainVisualization({ brainId, brainData, pulseTime, showNoActivity }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ template: null, outline: null });
  const offscreenCanvasRef = useRef(null);
  
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
    templateImg.onload = () => {
      imagesRef.current.template = templateImg;
    };
    
    // Load outline image as mask
    const outlineImg = new window.Image();
    outlineImg.src = '/images/template_150.png'; // Use your transparent outline
    outlineImg.onload = () => {
      imagesRef.current.outline = outlineImg;
    };
    
    return () => {
      // Cleanup
      offscreenCanvasRef.current = null;
      imagesRef.current.outline = null;
    };
  }, []);
  
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
  const renderBrain = useCallback((ctx, width, height) => {
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
    ctx.fillRect(0, 0, width, height);
    
    // Brain dimensions
    const brainWidth = width * 0.8;
    const brainHeight = height * 0.8;
    const brainX = width / 2 - brainWidth / 2;
    const brainY = height / 2 - brainHeight / 2;
    
    // Draw advanced contour map FIRST for strongest visual impact
    drawAdvancedContourMap(
      ctx,
      animatedChannels,
      width,
      height,
      colors,
      imagesRef.current.outline, // Pass the outline image as mask
      isActive
    );
    
    // No need to draw the brain shape again as it's handled in the masking process
    
    // Draw brain ID label with gradient
    const labelGradient = ctx.createLinearGradient(width/2 - 50, 0, width/2 + 50, 0);
    labelGradient.addColorStop(0, `rgba(${colors.accent[0]}, ${colors.accent[1]}, ${colors.accent[2]}, 0.8)`);
    labelGradient.addColorStop(1, `rgba(${colors.accent[0]}, ${colors.accent[1]}, ${colors.accent[2]}, 1.0)`);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = labelGradient;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`Brain ${brainId + 1}`, width / 2, 20);
    ctx.shadowBlur = 0;
    
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
          pulseFactor = (Math.sin(pulseTime * 4) + 1.0) * 0.3 + 0.7; // Moderate pulse
        } else {
          pulseFactor = pulseValue * 0.1 + 0.95; // Minimal pulsing for non-changing electrodes
        }
        
        size = baseSize * pulseFactor;
      } else {
        color = colors.inactive;
        size = 2;
      }
      
      // Get electrode position
      const position = ELECTRODE_POSITIONS[channelId];
      if (!position) continue;
      
      const [x, y] = templateToScreen(position.x, position.y, width, height);
      
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
    
  }, [brainId, colors, animatedChannels, pulseTime, isActive]);
  
  // OPTIMIZATION: Use requestAnimationFrame for smooth rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Request animation frame to render at best time
    const animationFrame = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      renderBrain(ctx, width, height);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [renderBrain]);
  
  // Calculate stats
  const activeChannels = channels.filter(ch => ch.totalTransitions > 0).length;
  const peakActivity = channels.length > 0 ? Math.max(...channels.map(ch => ch.totalTransitions), 0) : 0;
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        style={{ width: '100%', height: '100%' }}
      />
      <StatsOverlay>
        Active: {activeChannels}/24 • Peak: {peakActivity}
      </StatsOverlay>
      
      {/* Show inactive overlay if brain is not active and showNoActivity is true */}
      {!isActive && showNoActivity && (
        <InactiveBrainOverlay>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
              No Activity Detected
            </Typography>
          </Box>
        </InactiveBrainOverlay>
      )}
    </Box>
  );
}

// Settings dialog component
function SettingsDialog({ open, onClose, settings, onSettingsChange }) {
  const [tempSettings, setTempSettings] = useState({ ...settings });
  
  useEffect(() => {
    setTempSettings({ ...settings });
  }, [settings, open]);
  
  const handleChange = (field, value) => {
    setTempSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = () => {
    onSettingsChange(tempSettings);
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Visualization Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <Typography variant="subtitle1" gutterBottom>Data Source</Typography>
          <TextField
            fullWidth
            label="Data File Path"
            value={tempSettings.dataFilePath}
            onChange={(e) => handleChange('dataFilePath', e.target.value)}
            margin="normal"
            variant="outlined"
            helperText="Path to the logic_data.txt file"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Update Interval</Typography>
          <Typography id="update-interval-slider" gutterBottom>
            {tempSettings.updateInterval / 1000} seconds
          </Typography>
          <Slider
            value={tempSettings.updateInterval}
            min={500}
            max={5000}
            step={100}
            onChange={(_, value) => handleChange('updateInterval', value)}
            aria-labelledby="update-interval-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value/1000}s`}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Display Options</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.showInactiveOverlay}
                onChange={(e) => handleChange('showInactiveOverlay', e.target.checked)}
              />
            }
            label="Show 'No Activity' overlay on inactive brains"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main application component
export default function MultiBrainVisualization() {
  // Use useState with empty/null initial values to prevent hydration issues
  const [brains, setBrains] = useState([]);
  const [allBrainData, setAllBrainData] = useState(null);
  const [fps, setFps] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedBrainId, setSelectedBrainId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataStatus, setDataStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [clientReady, setClientReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    dataFilePath: '/data/logic_data.txt',
    updateInterval: 1500, // 1.5 seconds by default
    showInactiveOverlay: true
  });
  
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  const fpsCounterRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const fileCheckIntervalRef = useRef(null);
  const manualRefreshRef = useRef(false);
  
  // Set client-ready state after mount to avoid hydration issues
  useEffect(() => {
    setClientReady(true);
    setCurrentTime(new Date().toLocaleTimeString());
    setLastUpdated(new Date());
    lastFpsTimeRef.current = Date.now();
  }, []);
  
  // OPTIMIZATION: Memoize brain initialization
  const initializeBrains = useCallback(async () => {
    // Initialize 12 empty brains
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      pulseTime: Math.random() * Math.PI * 2, // Different start phase for each brain
      isActive: false,
      channels: []
    }));
  }, []);
  
  // Load brain data from file
  const loadBrainData = useCallback(async () => {
    try {
      setDataStatus('loading');
      const data = await parseLogicData(settings.dataFilePath);
      
      if (!data) {
        console.error('Failed to load brain data from file');
        setDataStatus('error');
        return null;
      }
      
      setDataStatus('success');
      setLastUpdated(new Date());
      return data;
    } catch (error) {
      console.error('Error loading brain data:', error);
      setDataStatus('error');
      return null;
    }
  }, [settings.dataFilePath]);
  
  // Initialize brain data - only on client side
  useEffect(() => {
    if (!clientReady) return;
    
    const initBrains = async () => {
      const initialBrains = await initializeBrains();
      setBrains(initialBrains);
      
      // Initial data load
      const initialData = await loadBrainData();
      setAllBrainData(initialData);
      
      // Update brain data from initial load
      if (initialData) {
        updateBrainsFromData(initialBrains, initialData);
      }
    };
    
    initBrains();
    
    // Update clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // Set up periodic file checking
    fileCheckIntervalRef.current = setInterval(async () => {
      const data = await loadBrainData();
      
      if (data) {
        setAllBrainData(data);
      }
    }, settings.updateInterval);
    
    return () => {
      clearInterval(clockInterval);
      if (fileCheckIntervalRef.current) {
        clearInterval(fileCheckIntervalRef.current);
      }
    };
  }, [clientReady, initializeBrains, loadBrainData, settings.updateInterval]);
  
  // Update brains when settings change
  useEffect(() => {
    if (!clientReady) return;
    
    // Clear existing interval
    if (fileCheckIntervalRef.current) {
      clearInterval(fileCheckIntervalRef.current);
    }
    
    // Set up new interval with updated settings
    fileCheckIntervalRef.current = setInterval(async () => {
      const data = await loadBrainData();
      
      if (data) {
        setAllBrainData(data);
      }
    }, settings.updateInterval);
    
    // Trigger immediate refresh when settings change
    if (manualRefreshRef.current) {
      manualRefreshRef.current = false;
      loadBrainData().then(data => {
        if (data) {
          setAllBrainData(data);
        }
      });
    }
    
    return () => {
      if (fileCheckIntervalRef.current) {
        clearInterval(fileCheckIntervalRef.current);
      }
    };
  }, [clientReady, loadBrainData, settings]);
  
  // Update brains when data changes
  const updateBrainsFromData = useCallback((currentBrains, brainData) => {
    if (!brainData || !currentBrains) return currentBrains;
    
    const updatedBrains = [...currentBrains];
    
    // Update each brain with its data
    for (let i = 0; i < updatedBrains.length; i++) {
      const brainDataItem = getBrainData(brainData, i);
      
      // Keep pulse time but update channels
      updatedBrains[i] = {
        ...updatedBrains[i],
        isActive: brainDataItem?.isActive || false,
        channels: brainDataItem?.channels || [],
        serialNumber: brainDataItem?.serialNumber || 'Unknown',
        model: brainDataItem?.model || 'Unknown',
        captureCount: brainDataItem?.captureCount || 0
      };
    }
    
    return updatedBrains;
  }, []);
  
  // OPTIMIZATION: Separate animation loop to avoid re-renders
  useEffect(() => {
    if (!clientReady || brains.length === 0) return;
    
    let animationRunning = true;
    let localBrains = [...brains];
    
    // Animation function
    const animate = async () => {
      if (!animationRunning) return;
      
      // Update FPS counter
      fpsCounterRef.current += 1;
      const currentTime = Date.now();
      
      if (currentTime - lastFpsTimeRef.current >= 1000) {
        setFps((fpsCounterRef.current * 1000) / (currentTime - lastFpsTimeRef.current));
        fpsCounterRef.current = 0;
        lastFpsTimeRef.current = currentTime;
      }

      // Update brain data if allBrainData has changed
      if (allBrainData) {
        localBrains = updateBrainsFromData(localBrains, allBrainData);
        setBrains(localBrains);
      }
      
      // Always update pulse time for smooth animation
      localBrains = localBrains.map(brain => ({
        ...brain,
        pulseTime: brain.pulseTime + 0.02,
      }));
      
      // Update state for animation
      setBrains(localBrains);
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      animationRunning = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [clientReady, brains.length, allBrainData, updateBrainsFromData]);
  
  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  // Toggle info panel
  const toggleInfoPanel = useCallback(() => {
    setShowInfoPanel(prev => !prev);
  }, []);
  
  // Select a brain for detailed view
  const handleBrainSelect = useCallback((brainId) => {
    setSelectedBrainId(brainId);
    setShowInfoPanel(true);
  }, []);
  
  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    manualRefreshRef.current = true;
    const data = await loadBrainData();
    if (data) {
      setAllBrainData(data);
    }
  }, [loadBrainData]);
  
  // Open settings dialog
  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);
  
  // Save settings
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    manualRefreshRef.current = true;
  }, []);
  
  // Get details for selected brain
  const selectedBrain = useMemo(() => {
    if (selectedBrainId === null || !brains.length) return null;
    return brains.find(brain => brain.id === selectedBrainId);
  }, [selectedBrainId, brains]);
  
  useEffect(() => {
    if (!clientReady) return;
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [clientReady]);
  
  // If not client-ready, render a minimal placeholder to avoid hydration errors
  if (!clientReady) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AppContainer>
          <AppBar position="static" elevation={0} color="transparent">
            <StyledToolbar>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BrainIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h4" component="h1" color="primary" sx={{ flexGrow: 1 }}>
                  Multi-Brain Neural Activity Monitor
                </Typography>
              </Box>
            </StyledToolbar>
          </AppBar>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Loading visualization...</Typography>
          </Box>
        </AppContainer>
      </ThemeProvider>
    );
  }
  
  return (
    <>
      <Head>
        <title>Multi-Brain Neural Activity Monitor</title>
        <meta name="description" content="Advanced real-time visualization of neural activity across multiple brains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AppContainer ref={containerRef} sx={{ position: 'relative' }}>
          <AppBar position="static" elevation={0} color="transparent">
            <StyledToolbar>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BrainIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h4" component="h1" color="primary" sx={{ flexGrow: 1 }}>
                  Multi-Brain Neural Activity Monitor
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <HeaderButton 
                startIcon={<RefreshIcon />}
                variant="outlined" 
                size="small"
                onClick={handleManualRefresh}
              >
                Refresh
              </HeaderButton>
              
              <HeaderButton 
                startIcon={<InfoIcon />}
                variant="outlined" 
                size="small"
                onClick={toggleInfoPanel}
              >
                {showInfoPanel ? 'Hide Info' : 'Show Info'}
              </HeaderButton>
              
              <HeaderButton 
                startIcon={<SettingsIcon />}
                variant="outlined" 
                size="small"
                onClick={handleOpenSettings}
              >
                Settings
              </HeaderButton>
              
              <HeaderButton 
                startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                variant="outlined" 
                size="small"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </HeaderButton>
            </StyledToolbar>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              px: 3, 
              py: 1,
              background: 'linear-gradient(90deg, rgba(10,10,30,0.6) 0%, rgba(15,15,40,0.6) 100%)'
            }}>
              <Typography variant="body1" component="div">
                Real-time Visualization of 12 Brain Activity Patterns
                <Box component="span" sx={{ ml: 2 }}>
                  <ActivityIndicator $active={dataStatus === 'success'} />
                  {dataStatus === 'loading' ? 'Loading Data...' : 
                   dataStatus === 'success' ? 'Live Data' : 'Data Error'}
                </Box>
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body1" color="secondary">FPS: {fps.toFixed(1)}</Typography>
                <Typography variant="body1">{currentTime}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : ''}
                </Typography>
              </Box>
            </Box>
          </AppBar>
          
          <Container maxWidth={false} sx={{ flexGrow: 1, py: 1, position: 'relative' }}>
            <Grid container spacing={1.5} sx={{ height: '100%' }}>
              {brains.map(brain => (
                <Grid item md={3} key={brain.id} sx={{ height: '33%' }}>
                  <BrainCell 
                    elevation={4}
                    onClick={() => handleBrainSelect(brain.id)}
                    sx={{
                      cursor: 'pointer',
                      border: selectedBrainId === brain.id ? `2px solid ${darkTheme.palette.primary.main}` : 'none',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02) translateY(-2px)'
                      }
                    }}
                  >
                    <BrainVisualization 
                      brainId={brain.id}
                      brainData={{
                        isActive: brain.isActive,
                        channels: brain.channels,
                        serialNumber: brain.serialNumber,
                        model: brain.model,
                        captureCount: brain.captureCount
                      }}
                      pulseTime={brain.pulseTime}
                      showNoActivity={settings.showInactiveOverlay}
                    />
                  </BrainCell>
                </Grid>
              ))}
            </Grid>
            
            {/* Color scale legend */}
            <ColorScaleLegend>
              <Box sx={{ position: 'absolute', left: 32, top: 0, color: '#fff', fontSize: 12, fontWeight: 500 }}>
                High
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ position: 'absolute', left: 32, bottom: 0, color: '#fff', fontSize: 12, fontWeight: 500 }}>
                Low
              </Box>
            </ColorScaleLegend>
            <Box sx={{ position: 'absolute', right: 10, top: 250, color: '#fff', fontSize: 12, textAlign: 'center', width: 60 }}>
              <div>Activity</div>
              <div>Level</div>
            </Box>
            
            {/* Info Panel */}
            <InfoPanel className={showInfoPanel ? 'visible' : ''}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  {selectedBrain ? `Brain ${selectedBrain.id + 1} Details` : 'System Information'}
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                  onClick={toggleInfoPanel}
                >
                  Close
                </Button>
              </Box>
              
              {selectedBrain ? (
                <>
                  <DetailCard>
                    <Typography variant="subtitle1" gutterBottom>Brain Information</Typography>
                    <Typography variant="body2">
                      Serial Number: {selectedBrain.serialNumber || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      Model: {selectedBrain.model || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      Status: {selectedBrain.isActive ? 
                        <span style={{ color: '#4caf50' }}>Active</span> : 
                        <span style={{ color: '#f44336' }}>Inactive</span>}
                    </Typography>
                    <Typography variant="body2">
                      Capture Count: {selectedBrain.captureCount || 0}
                    </Typography>
                  </DetailCard>
                  
                  <DetailCard>
                    <Typography variant="subtitle1" gutterBottom>Activity Summary</Typography>
                    <Typography variant="body2">
                      Active Electrodes: {selectedBrain.channels.filter(ch => ch.totalTransitions > 0).length} / {selectedBrain.channels.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      Max Activity: {selectedBrain.channels.length > 0 ? 
                        Math.max(...selectedBrain.channels.map(ch => ch.totalTransitions), 0) : 0}
                    </Typography>
                    <Typography variant="body2">
                      Recent Changes: {selectedBrain.channels.filter(ch => ch.changed).length}
                    </Typography>
                  </DetailCard>
                  
                  <DetailCard>
                    <Typography variant="subtitle1" gutterBottom>Electrode Status</Typography>
                    {selectedBrain.channels.length > 0 ? (
                      <Box sx={{ maxHeight: 300, overflowY: 'auto', pl: 1 }}>
                        {selectedBrain.channels.map((channel) => (
                          <Box key={channel.channel} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <ActivityIndicator $active={channel.totalTransitions > 0} />
                            <Typography variant="body2" sx={{ fontWeight: channel.changed ? 'bold' : 'normal' }}>
                              {channel.name}: {channel.totalTransitions} transitions
                              {channel.changed && <span style={{ color: '#ff80ff', marginLeft: 4 }}>• ACTIVE</span>}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No electrode data available for this brain
                      </Typography>
                    )}
                  </DetailCard>
                </>
              ) : (
                <>
                  <DetailCard>
                    <Typography variant="subtitle1" gutterBottom>System Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {dataStatus === 'success' ? (
                        <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
                      ) : (
                        <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="body2">
                        Data Status: {dataStatus === 'loading' ? 'Loading...' : 
                                     dataStatus === 'success' ? 'Data loaded successfully' : 
                                     'Error loading data'}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      Data File: {settings.dataFilePath}
                    </Typography>
                    <Typography variant="body2">
                      Update Interval: {settings.updateInterval / 1000} seconds
                    </Typography>
                    <Typography variant="body2">
                      Last Data Update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                    </Typography>
                    <Typography variant="body2">
                      Active Brains: {brains.filter(b => b.isActive).length} / {brains.length}
                    </Typography>
                  </DetailCard>
                  
                  <DetailCard>
                    <Typography variant="subtitle1" gutterBottom>Controls</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      <ControlButton 
                        size="small" 
                        variant="contained"
                        onClick={handleManualRefresh}
                        startIcon={<RefreshIcon />}
                      >
                        Refresh Data
                      </ControlButton>
                      <ControlButton 
                        size="small" 
                        variant="contained"
                        onClick={handleOpenSettings}
                        startIcon={<SettingsIcon />}
                      >
                        Settings
                      </ControlButton>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Click on any brain visualization for detailed analysis
                      </Typography>
                    </Box>
                  </DetailCard>
                </>
              )}
            </InfoPanel>
          </Container>
          
          <FooterBar>
            <Typography variant="caption">
              © {new Date().getFullYear()} Neural Activity Visualization • Advanced Monitoring System
            </Typography>
          </FooterBar>
          
          {/* Settings Dialog */}
          <SettingsDialog 
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </AppContainer>
      </ThemeProvider>
    </>
  );
}