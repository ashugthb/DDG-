// brainUtils.js - Shared utility functions and constants for the brain visualization

// CONSTANTS
// Template bounds
export const TEMPLATE_MIN_X = 12;
export const TEMPLATE_MAX_X = 55;
export const TEMPLATE_MIN_Y = 24; 
export const TEMPLATE_MAX_Y = 86;

// Enhanced colormap with 15+ colors for smoother transitions
export const COLORMAP = [
  [0, 0, 128],     // Navy (lowest activity)
  [0, 0, 255],     // Blue
  [0, 64, 255],    // Light blue
  [0, 128, 255],   // Sky blue
  [0, 192, 255],   // Azure
  [0, 255, 255],   // Cyan
  [0, 255, 192],   // Aquamarine
  [0, 255, 128],   // Light green
  [0, 255, 64],    // Spring green
  [0, 255, 0],     // Green
  [64, 255, 0],    // Chartreuse
  [128, 255, 0],   // Lime green
  [192, 255, 0],   // Yellow-green
  [255, 255, 0],   // Yellow
  [255, 224, 0],   // Gold
  [255, 192, 0],   // Amber
  [255, 160, 0],   // Orange-yellow
  [255, 128, 0],   // Orange
  [255, 96, 0],    // Burnt orange
  [255, 64, 0],    // Red-orange
  [255, 32, 0],    // Vermilion
  [255, 0, 0]      // Red (highest activity)
];

// OPTIMIZATION: Pre-computed electrode positions to avoid recalculating
export const ELECTRODE_POSITIONS = {
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

// Default settings with comprehensive configuration options
export const DEFAULT_SETTINGS = {
  // General settings
  dataFilePath: '/data/logic_data.txt',
  updateInterval: 1500, // 1.5 seconds by default
  showInactiveOverlay: true,
  useGroupedConnection: true,
  groupSwitchDelayMs: 500,
  
  // Display settings
  enhancedVisualization: true,
  showChannelLabels: false,
  colorTheme: 'default',
  lowActivityThreshold: 10,
  mediumActivityThreshold: 50,
  highActivityThreshold: 100,
  
  // Default device settings
  defaultSampleRate: 8, // 100MHz
  defaultSampleDepth: 200000,
  defaultScanInterval: 100,
  defaultVoltageThreshold: 0.98,
  defaultEnableTrigger: false,
  defaultTriggerChannel: 0,
  defaultTriggerRisingEdge: true,
  
  // Channel naming tab
  channelNameTab: 0,
  
  // Individual device settings
  deviceSettings: Array.from({ length: 12 }, (_, index) => ({
    enabled: true,
    name: `Brain ${index + 1}`,
    sampleRate: -1, // -1 means use default
    sampleDepth: 0, // 0 means use default
    scanInterval: 0, // 0 means use default
    voltageThreshold: 0, // 0 means use default
    enableTrigger: false,
    triggerChannel: 0,
    triggerRisingEdge: true,
    // Channel names for each device (24 channels per device)
    channelNames: Array.from({ length: 24 }, (_, i) => {
      // Format: A0-A11 for first 12, B0-B11 for next 12
      const prefix = i < 12 ? 'A' : 'B';
      const num = i < 12 ? i : i - 12;
      return `${prefix}${num}`;
    })
  }))
};

// Sample rate options for settings
export const SAMPLE_RATE_OPTIONS = [
  { value: 0, label: '1 MHz' },
  { value: 1, label: '2 MHz' },
  { value: 2, label: '5 MHz' },
  { value: 3, label: '10 MHz' },
  { value: 4, label: '20 MHz' },
  { value: 5, label: '25 MHz' },
  { value: 6, label: '50 MHz' },
  { value: 7, label: '80 MHz' },
  { value: 8, label: '100 MHz' },
  { value: 9, label: '125 MHz' },
  { value: 10, label: '200 MHz' },
  { value: 11, label: '250 MHz' },
  { value: 12, label: '400 MHz' }
];

// Helper: interpolate between two colors
export function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

// HSV to RGB conversion for brain color scheme generation
export function hsvToRgb(h, s, v) {
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
export function createBrainColors(brainId) {
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

// Get color and size based on channel activity level - Enhanced with more gradations
export function getActivityColorAndSize(channel, colors) {
  if (!channel || channel.totalTransitions === 0) {
    return { color: colors.inactive, size: 2 };
  }
  
  // Determine color based on activity level with more granular gradations
  if (channel.totalTransitions > 150) {
    return { color: colors.highActivity, size: 4.5 }; // Red for very high activity
  } else if (channel.totalTransitions > 100) {
    return { color: [255, 64, 0], size: 4 }; // Red-orange for high activity
  } else if (channel.totalTransitions > 80) {
    return { color: [255, 128, 0], size: 3.8 }; // Orange for medium-high activity
  } else if (channel.totalTransitions > 60) {
    return { color: [255, 192, 0], size: 3.6 }; // Yellow-orange for medium-high activity
  } else if (channel.totalTransitions > 50) {
    return { color: [255, 255, 0], size: 3.5 }; // Yellow for medium activity
  } else if (channel.totalTransitions > 40) {
    return { color: [192, 255, 0], size: 3.4 }; // Yellow-green for medium-low activity
  } else if (channel.totalTransitions > 30) {
    return { color: [128, 255, 0], size: 3.3 }; // Lime green for medium-low activity
  } else if (channel.totalTransitions > 20) {
    return { color: [0, 255, 0], size: 3.2 }; // Green for low-medium activity
  } else if (channel.totalTransitions > 10) {
    return { color: [0, 192, 255], size: 3 }; // Sky blue for low activity
  } else if (channel.totalTransitions > 5) {
    return { color: [0, 128, 255], size: 2.8 }; // Light blue for very low activity
  } else if (channel.totalTransitions > 0) {
    return { color: [0, 64, 255], size: 2.6 }; // Blue for minimal activity
  } else {
    return { color: colors.inactive, size: 2.5 }; // Gray for no activity
  }
}

// Convert template coordinates to screen coordinates
export function templateToScreen(templateX, templateY, width, height) {
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

// OPTIMIZATION: Pre-compute and cache brain mask
const brainMaskCache = new Map();
export function getBrainMask(gridSize) {
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

// OPTIMIZATION: More efficient contour plotting function with enhanced coloring
export function drawAdvancedContourMap(
  ctx,
  channels,
  width,
  height,
  colors,
  outlineImg,
  templateImg,
  isActive
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const brainWidth = width * 0.8;
  const brainHeight = height * 0.8;
  const brainX = centerX - brainWidth / 2;
  const brainY = centerY - brainHeight / 2 + 15; // Adjust vertical alignment

  function createInvertedMask(templateImg, width, height) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.drawImage(templateImg, 0, 0, width, height);
    const maskData = maskCtx.getImageData(0, 0, width, height);
    const data = maskData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Invert: transparent (alpha=0) becomes opaque (alpha=255), black/opaque becomes transparent
      if (data[i+3] === 0) {
        data[i+3] = 255;
      } else {
        data[i+3] = 0;
      }
    }
    maskCtx.putImageData(maskData, 0, 0);
    return maskCanvas;
  }

  // --- INACTIVE BRAIN: dark blue mask + electrodes ---
  if (!isActive || !channels || channels.length === 0) {
    if (templateImg && templateImg.complete) {
      // 1. Create a temp canvas for the field and electrodes
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = brainWidth;
      tempCanvas.height = brainHeight;
      const tempCtx = tempCanvas.getContext('2d');

      // 2. Draw the dark blue background (low activity, fill full canvas)
      tempCtx.fillStyle = "rgba(5, 20, 60, 0.95)"; // dark blue, adjust as needed
      tempCtx.fillRect(0, 0, brainWidth, brainHeight);

      // 3. Draw all electrodes as gray dots inside (on the temp canvas, NOT main ctx!)
      if (channels && channels.length > 0) {
        for (const channel of channels) {
          const electrode = ELECTRODE_POSITIONS[channel.channel];
          if (!electrode) continue;
          const xCanvas = (electrode.x / templateImg.width) * brainWidth;
          const yCanvas = (electrode.y / templateImg.height) * brainHeight;
          tempCtx.beginPath();
          tempCtx.arc(xCanvas, yCanvas, 6, 0, Math.PI * 2);
          tempCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
          tempCtx.fill();
          tempCtx.closePath();
        }
      }

      // 4. Mask with inverted mask
      const mask = createInvertedMask(templateImg, brainWidth, brainHeight);
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(mask, 0, 0, brainWidth, brainHeight);
      tempCtx.globalCompositeOperation = "source-over";

      // 5. Draw result on main canvas
      ctx.drawImage(tempCanvas, brainX, brainY);
    }

    // 6. Draw outline always on top
    if (outlineImg && outlineImg.complete) {
      ctx.globalAlpha = 1.0;
      ctx.drawImage(outlineImg, brainX, brainY, brainWidth, brainHeight);
    }
    return;
  }
  // --- 2. Active: draw contour masked by inverted template ---
  // (contour code as before)

  const gridSize = 80;
  const xdiff = TEMPLATE_MAX_X - TEMPLATE_MIN_X;
  const ydiff = TEMPLATE_MAX_Y - TEMPLATE_MIN_Y;
  const x = [], y = [], z = [];
  let avgActivity = 0, activeCount = 0;

  for (const channel of channels) {
    const electrode = ELECTRODE_POSITIONS[channel.channel];
    if (!electrode) continue;
    const normX = ((electrode.x - TEMPLATE_MIN_X) / xdiff) * 4;
const normY = ((electrode.y - TEMPLATE_MIN_Y) / ydiff) * 4;
    let activity;
    if (channel.totalTransitions > 0) {
      activity = Math.min(1.0, channel.totalTransitions / 150.0) * 3.0 + 0.5;
      avgActivity += activity;
      activeCount += 1;
    } else {
      activity = 0.2;
    }
    x.push(normX);
    y.push(normY);
    z.push(activity);
  }
  if (x.length === 0) return;
  if (activeCount > 0) avgActivity /= activeCount;
  else avgActivity = 0.2;

  const corners = [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
    [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4]
  ];
  for (const [cx, cy] of corners) {
    x.push(cx);
    y.push(cy);
    z.push(avgActivity * 0.6);
  }

  const zi = new Float32Array(gridSize * gridSize);
  const gxValues = new Float32Array(gridSize);
  const gyValues = new Float32Array(gridSize);
  for (let i = 0; i < gridSize; i++) {
    gxValues[i] = i / gridSize * 4;
    gyValues[i] = i / gridSize * 4;
  }
  const distances = new Float32Array(x.length);
  const weights = new Float32Array(x.length);
  for (let j = 0; j < gridSize; j++) {
    const gy = gyValues[j];
    for (let i = 0; i < gridSize; i++) {
      const index = j * gridSize + i;
      const gx = gxValues[i];
      let weightSum = 0, valueSum = 0, foundExactMatch = false;
      for (let k = 0; k < x.length; k++) {
        const dx = gx - x[k];
        const dy = gy - y[k];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.0001) {
          zi[index] = z[k];
          foundExactMatch = true;
          break;
        }
        distances[k] = dist;
        const weight = 1 / Math.pow(dist, 2);
        weights[k] = weight;
        weightSum += weight;
        valueSum += z[k] * weight;
      }
      if (!foundExactMatch && weightSum > 0) {
        zi[index] = valueSum / weightSum;
      } else if (!foundExactMatch) {
        zi[index] = NaN;
      }
    }
  }

  let ziMin = Infinity, ziMax = -Infinity;
  for (let i = 0; i < zi.length; i++) {
    if (!isNaN(zi[i])) {
      ziMin = Math.min(ziMin, zi[i]);
      ziMax = Math.max(ziMax, zi[i]);
    }
  }
  const contrast = 1.8;
  const ziRange = Math.max(0.1, ziMax - ziMin);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = gridSize;
  tempCanvas.height = gridSize;
  const tempCtx = tempCanvas.getContext('2d');
  const imageData = tempCtx.createImageData(gridSize, gridSize);
  const data = imageData.data;
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      const index = j * gridSize + i;
      const pixelIndex = (j * gridSize + i) * 4;
      if (isNaN(zi[index])) {
        data[pixelIndex + 3] = 0;
        continue;
      }
      const normalizedVal = (zi[index] - ziMin) / ziRange;
      let val = 0.5 + (normalizedVal - 0.5) * contrast;
      val = Math.max(0, Math.min(1, val));
      const scaled = val * (COLORMAP.length - 1);
      const idx = Math.min(Math.floor(scaled), COLORMAP.length - 2);
      const frac = scaled - idx;
      const colorA = COLORMAP[idx];
      const colorB = COLORMAP[idx + 1];
      const color = lerpColor(colorA, colorB, frac);
      data[pixelIndex] = color[0];
      data[pixelIndex + 1] = color[1];
      data[pixelIndex + 2] = color[2];
      data[pixelIndex + 3] = Math.min(255, 180 + val * 75);
    }
  }
  tempCtx.putImageData(imageData, 0, 0);

  // Mask the activity contour using the inverted brain mask (templateImg)
  let maskedContour = tempCanvas;
  if (templateImg && templateImg.complete) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = brainWidth;
    maskCanvas.height = brainHeight;
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.drawImage(tempCanvas, 0, 0, brainWidth, brainHeight);

    // INVERT THE MASK HERE
    const invertedMask = createInvertedMask(templateImg, brainWidth, brainHeight);

    maskCtx.globalCompositeOperation = 'destination-in';
    maskCtx.drawImage(invertedMask, 0, 0, brainWidth, brainHeight);
    maskCtx.globalCompositeOperation = 'source-over';
    maskedContour = maskCanvas;
  }
  ctx.drawImage(maskedContour, brainX, brainY, brainWidth, brainHeight);

  // Optional: activity glow
  if (isActive && activeCount > 0) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.filter = 'blur(8px)';
    ctx.drawImage(maskedContour, brainX, brainY, brainWidth, brainHeight);
    ctx.restore();
  }

  // Always draw the outline border last
  if (outlineImg && outlineImg.complete) {
    ctx.globalAlpha = 1.0;
    ctx.drawImage(outlineImg, brainX, brainY, brainWidth, brainHeight);
  }
}



// Function to parse the logic data file
export async function parseLogicData(filePath) {
  try {
    // Make sure we're fetching with cache: 'no-store' to get fresh data every time
    const response = await fetch(filePath, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'text/plain'
      }
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
    
    console.log(`Successfully parsed data for ${brainData.length} brains`);
    return brainData;
  } catch (error) {
    console.error('Error parsing logic data:', error);
    return null;
  }
}

// Get brain data for a specific brain from parsed data
export function getBrainData(brainData, brainId) {
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