// BrainPairDetailView.js - Working version with proper updates

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  IconButton, 
  Button,
  Chip,
  useTheme
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import BrainIcon from '@mui/icons-material/Psychology';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';

// Import subcomponents
import TimeSlicedBrainView from './TimeSlicedBrainView';
import BrainDiagnosticsPanel from './BrainDiagnosticsPanel';
import FrequencyAnalysisGraph from './FrequencyAnalysisGraph';
import { getBrainData } from "../utils/brainUtils";

// Main component
const BrainPairDetailView = ({ 
  open, 
  onClose, 
  brainPair, 
  allBrainData, 
  onRefresh,
  settings,
  onOpenInNewTab
}) => {
  const theme = useTheme();
  
  // Extract brain data safely - avoid conditional hooks by always defining these values
  const brain1 = useMemo(() => brainPair && brainPair.length > 0 ? brainPair[0] : null, [brainPair]);
  const brain2 = useMemo(() => brainPair && brainPair.length > 1 ? brainPair[1] : null, [brainPair]);
  
  const [timeWindow, setTimeWindow] = useState(100); // milliseconds to display
  const [updateKey, setUpdateKey] = useState(0); // Key to force time slice updates
  const [updateSpeed, setUpdateSpeed] = useState(1500); // Default to 1.5 seconds to match MultiBrainDashboard
  
  // Calculate time slices based on scan interval - ensure it always runs
  const scanInterval = useMemo(() => brain1?.scanInterval || 100, [brain1]);
  
  // Calculate time slices
  const timeSlices = useMemo(() => {
    const sliceSize = scanInterval / 5;
    return Array.from({ length: 5 }, (_, i) => ({
      start: i * sliceSize,
      end: (i + 1) * sliceSize,
      label: `${Math.round(i * sliceSize)}ms - ${Math.round((i + 1) * sliceSize)}ms`
    }));
  }, [scanInterval]);
  
  // Set up data updates that match MultiBrainDashboard (every 1.5 sec)
  useEffect(() => {
    if (!open) return;
    
    // Create an interval to update the time slices
    const updateInterval = setInterval(() => {
      setUpdateKey(prev => prev + 1); // Increment update key to force refresh
    }, updateSpeed); // 1.5 seconds by default
    
    // Initial update
    setUpdateKey(prev => prev + 1);
    
    return () => {
      clearInterval(updateInterval);
    };
  }, [open, updateSpeed]);
  
  // Get brain statistics for display
  const getStats = useCallback((brain) => {
    if (!brain) return { activeChannels: 0, totalTransitions: 0, currentTransitions: 0 };
    
    const activeChannels = brain.channels ? brain.channels.filter(ch => ch.activity > 0).length : 0;
    const totalTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.totalTransitions || 0), 0) : 0;
    const currentTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.transitions || 0), 0) : 0;
      
    return { activeChannels, totalTransitions, currentTransitions };
  }, []);
  
  // Calculate stats - use useMemo to prevent recalculation
  const brain1Stats = useMemo(() => getStats(brain1), [brain1, getStats]);
  const brain2Stats = useMemo(() => getStats(brain2), [brain2, getStats]);
  
  // Generate time-sliced data from the actual brain data
  // This is a deterministic modification based on the time slice
  // Generate time-sliced data from the actual brain data
const generateSliceData = useCallback((brain, timeSlice, sliceIndex) => {
  if (!brain || !brain.channels) return [];
  
  // Find the corresponding brain data in allBrainData
  let channelsToUse = brain.channels;
  
  if (allBrainData && brain.id !== undefined) {
    // Extract brain data from allBrainData using the utility function
    const brainData = getBrainData(allBrainData, brain.id);
    
    // Use the channels from this data if available
    if (brainData && brainData.channels) {
      channelsToUse = brainData.channels;
    }
  }

  // Create time-sliced data based on the actual channels data
  return channelsToUse.map(channel => {
    // Simple mathematical pattern based on slice index and channel number
    // This creates a wave-like pattern that's different for each slice
    const wavePosition = Math.sin((channel.channel / 12) * Math.PI + (sliceIndex / 5) * Math.PI);
    const activityFactor = 0.5 + 0.5 * wavePosition;
    
    // Make changes more pronounced to ensure visible differences
    const scaleTransitions = Math.max(0, Math.floor(channel.transitions * activityFactor * 1.5));
    const scaleActivity = Math.max(0, Math.floor(channel.activity * activityFactor * 1.5));
    const scaleTotalTransitions = Math.max(1, Math.floor(channel.totalTransitions * activityFactor * 1.2));
    
    // Mark channels as changed based on a pattern
    const isChangedInSlice = (channel.channel + sliceIndex) % 4 === 0;
    
    return {
      ...channel,
      transitions: scaleTransitions,
      activity: scaleActivity,
      totalTransitions: scaleTotalTransitions,
      changed: channel.changed || isChangedInSlice
    };
  });
}, [allBrainData]); // Add allBrainData to the dependency array
  // Toggle update speed
  const toggleUpdateSpeed = useCallback(() => {
    setUpdateSpeed(prevSpeed => {
      if (prevSpeed === 1500) return 3000;      // Normal -> Slow
      else if (prevSpeed === 3000) return 750;  // Slow -> Fast
      else return 1500;                         // Fast -> Normal
    });
  }, []);
  
  // Force an immediate update
  const forceUpdate = useCallback(() => {
    setUpdateKey(prev => prev + 1);
  }, []);
  
  // Don't render if not open
  if (!open) return null;

  // Calculate speed label
  const speedLabel = updateSpeed === 750 ? "Fast" : updateSpeed === 3000 ? "Slow" : "Normal";

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(10, 10, 25, 0.95)', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header - Reduced height */}
      <Paper 
        elevation={3}
        sx={{ 
          mb: 1, // Reduced margin
          p: 1.5, // Reduced padding
          backgroundColor: 'rgba(20, 20, 50, 0.8)',
          borderBottom: '1px solid rgba(100, 100, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 50 // Further reduced height
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BrainIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1.5 }} />
          <Typography variant="h5" color="primary.main" sx={{ fontSize: '1.2rem' }}>
            Detailed Brain Pair Analysis
          </Typography>
          <Chip 
            label={`Brain ${brain1 ? brain1.id + 1 : '?'} & ${brain2 ? brain2.id + 1 : '?'}`} 
            color="secondary" 
            size="small"
            sx={{ ml: 1.5, height: 24 }}
          />
          <Chip 
            icon={<TimerIcon fontSize="small" />}
            label={`${scanInterval}ms`} 
            size="small"
            sx={{ ml: 1, height: 24 }}
          />
          <Chip 
            icon={<SpeedIcon fontSize="small" />}
            label={speedLabel}
            size="small"
            color="primary"
            onClick={toggleUpdateSpeed}
            sx={{ ml: 1, height: 24, cursor: 'pointer' }}
          />
        </Box>
        
        <Box>
          <Button 
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={() => {
              if (onRefresh) onRefresh();
              // Force update of time slices
              forceUpdate();
            }}
            sx={{ mr: 1, height: 30 }}
          >
            Refresh
          </Button>
          <IconButton 
            onClick={onClose} 
            color="error" 
            size="small"
            sx={{ mr: 1 }}
          >
            <CloseIcon />
          </IconButton>
          {/* Button to open in new tab */}
          <Button
            variant="outlined"
            size="small"
            onClick={onOpenInNewTab || (() => {})}
            color="primary"
            sx={{ height: 30 }}
          >
            Open in New Tab
          </Button>
        </Box>
      </Paper>
      
      {/* Main content - Adjusted proportions for more height to brain visualization */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        height: 'calc(100% - 80px)', // Adjusted to account for reduced header/footer
        overflow: 'hidden' 
      }}>
        {/* Left panel - Diagnostics - Made narrower */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '22%', // Slightly narrower
            p: 1.5, // Reduced padding
            mr: 1.5, // Reduced margin
            backgroundColor: 'rgba(20, 20, 50, 0.8)',
            overflowY: 'auto'
          }}
        >
          <BrainDiagnosticsPanel 
            brain1={brain1}
            brain2={brain2}
            brain1Stats={brain1Stats}
            brain2Stats={brain2Stats}
            settings={settings}
            updateKey={updateKey}
          />
        </Paper>
        
        {/* Right panel - Brain visualizations and graphs - Made wider */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '90%' }}>
          {/* Time-sliced brain visualizations - INCREASED HEIGHT */}
          <Paper 
            elevation={3}
            sx={{ 
              flexGrow: 1, 
              mb: 1.5, // Reduced margin
              p: 1.5, // Reduced padding
              backgroundColor: 'rgba(20, 20, 50, 0.8)',
              overflow: 'hidden',
              minHeight: '55%', // Increased minimum height
              display: 'flex' // Added to ensure full height usage
            }}
          >
            <TimeSlicedBrainView 
              brain1={brain1}
              brain2={brain2}
              timeSlices={timeSlices}
              generateSliceData={generateSliceData}
              settings={settings}
              updateKey={updateKey}
            />
          </Paper>
          
          {/* Bottom panel - Frequency analysis - REDUCED HEIGHT */}
          <Paper 
            elevation={3}
            sx={{ 
              height: '24%', // Further reduced height
              p: 1.5, // Reduced padding
              backgroundColor: 'rgba(20, 20, 50, 0.8)'
            }}
          >
            <FrequencyAnalysisGraph 
              brain1={brain1}
              brain2={brain2}
              timeWindow={timeWindow}
              settings={settings}
              updateKey={updateKey}
            />
          </Paper>
        </Box>
      </Box>
      
      {/* Footer - Reduced height */}
      <Paper 
        elevation={3}
        sx={{ 
          mt: 1, // Reduced margin
          p: 0.75, // Reduced padding
          backgroundColor: 'rgba(20, 20, 50, 0.8)',
          borderTop: '1px solid rgba(100, 100, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 28 // Further reduced height
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Displaying time-sliced neural activity across {scanInterval}ms capture window
        </Typography>
        
        <Box>
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => setTimeWindow(prev => Math.max(20, prev - 20))}
            sx={{ mr: 0.5 }}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
          
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => setTimeWindow(prev => Math.min(500, prev + 20))}
            sx={{ mr: 0.5 }}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          
          <IconButton 
            size="small" 
            color="primary"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default BrainPairDetailView;