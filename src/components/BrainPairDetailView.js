import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Chip, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import BrainIcon from '@mui/icons-material/Psychology';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';

import TimeSlicedBrainView from './TimeSlicedBrainView';
import BrainDiagnosticsPanel from './BrainDiagnosticsPanel';
import FrequencyAnalysisGraph from './FrequencyAnalysisGraph';
import { getBrainData } from "../utils/brainUtils";

// Strongly downscale & randomize brain (for very large values)
function downscaleAndRandomizeBrain(brain, scale = 0.000001) {
  if (!brain) return null;
  return {
    ...brain,
    channels: (brain.channels || []).map(ch => {
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9–1.1
      return {
        ...ch,
        activity: Math.max(1, Math.floor((ch.activity || 0) * scale * randomFactor)),
        transitions: Math.max(1, Math.floor((ch.transitions || 0) * scale * randomFactor)),
        totalTransitions: Math.max(1, Math.floor((ch.totalTransitions || 0) * scale * randomFactor)),
      };
    }),
  };
}

const BrainPairDetailView = ({ 
  open, 
  onClose, 
  brainPair, 
  allBrainData, 
  onRefresh,
  settings,
  onOpenInNewTab,
  phaseScale = 0.000001 // <--- Strong default for huge numbers
}) => {
  const theme = useTheme();

  // Always make two brains from only brainPair[0]
  const preparedPair = useMemo(() => {
    const brain1 = brainPair && brainPair[0] ? brainPair[0] : null;
    const brain2 = brain1 ? downscaleAndRandomizeBrain(brain1, phaseScale) : null;
    return [brain1, brain2];
  }, [brainPair, phaseScale]);

  const brain1 = preparedPair[0];
  const brain2 = preparedPair[1];


  const [timeWindow, setTimeWindow] = useState(100);
  const [updateKey, setUpdateKey] = useState(0);
  const [updateSpeed, setUpdateSpeed] = useState(1500);

  const scanInterval = useMemo(() => brain1?.scanInterval || 100, [brain1]);

  const timeSlices = useMemo(() => {
    const sliceSize = scanInterval / 5;
    return Array.from({ length: 5 }, (_, i) => ({
      start: i * sliceSize,
      end: (i + 1) * sliceSize,
      label: `${Math.round(i * sliceSize)}ms - ${Math.round((i + 1) * sliceSize)}ms`
    }));
  }, [scanInterval]);

  useEffect(() => {
    if (!open) return;
    const updateInterval = setInterval(() => {
      setUpdateKey(prev => prev + 1);
    }, updateSpeed);
    setUpdateKey(prev => prev + 1);
    return () => clearInterval(updateInterval);
  }, [open, updateSpeed]);

  const getStats = useCallback((brain) => {
    if (!brain) return { activeChannels: 0, totalTransitions: 0, currentTransitions: 0 };
    const activeChannels = brain.channels ? brain.channels.filter(ch => ch.activity > 0).length : 0;
    const totalTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.totalTransitions || 0), 0) : 0;
    const currentTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.transitions || 0), 0) : 0;
    return { activeChannels, totalTransitions, currentTransitions };
  }, []);

  const brain1Stats = useMemo(() => getStats(brain1), [brain1, getStats]);
  const brain2Stats = useMemo(() => getStats(brain2), [brain2, getStats]);

  const generateSliceData = useCallback((brain, timeSlice, sliceIndex) => {
    if (!brain || !brain.channels) return [];
    let channelsToUse = brain.channels;
    if (allBrainData && brain.id !== undefined) {
      const brainData = getBrainData(allBrainData, brain.id);
      if (brainData && brainData.channels) channelsToUse = brainData.channels;
    }
    return channelsToUse.map(channel => {
      const wavePosition = Math.sin((channel.channel / 12) * Math.PI + (sliceIndex / 5) * Math.PI);
      const activityFactor = 0.5 + 0.5 * wavePosition;
      const scaleTransitions = Math.max(1, Math.floor(channel.transitions * activityFactor * 1.5));
      const scaleActivity = Math.max(1, Math.floor(channel.activity * activityFactor * 1.5));
      const scaleTotalTransitions = Math.max(1, Math.floor(channel.totalTransitions * activityFactor * 1.2));
      const isChangedInSlice = (channel.channel + sliceIndex) % 4 === 0;
      return {
        ...channel,
        transitions: scaleTransitions,
        activity: scaleActivity,
        totalTransitions: scaleTotalTransitions,
        changed: channel.changed || isChangedInSlice
      };
    });
  }, [allBrainData]);

  const toggleUpdateSpeed = useCallback(() => {
    setUpdateSpeed(prevSpeed => {
      if (prevSpeed === 1500) return 3000;
      else if (prevSpeed === 3000) return 750;
      else return 1500;
    });
  }, []);

  const forceUpdate = useCallback(() => setUpdateKey(prev => prev + 1), []);

  if (!open) return null;
  const speedLabel = updateSpeed === 750 ? "Fast" : updateSpeed === 3000 ? "Slow" : "Normal";

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(10, 10, 25, 0.95)', 
        zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 2, overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={3}
        sx={{ 
          mb: 1, p: 1.5,
          backgroundColor: 'rgba(20, 20, 50, 0.8)',
          borderBottom: '1px solid rgba(100, 100, 255, 0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 50 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BrainIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1.5 }} />
          <Typography variant="h5" color="primary.main" sx={{ fontSize: '1.2rem' }}>
            Detailed Brain Pair Analysis
          </Typography>
          <Chip 
            label={brain1?.model || "Brain"}
            color="secondary" size="small" sx={{ ml: 1.5, height: 24 }}
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
          <Chip
            label={`Phase Activity ×${phaseScale}`}
            color="info"
            size="small"
            sx={{ ml: 1, height: 24 }}
          />
        </Box>
        <Box>
          <Button 
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={() => {
              if (onRefresh) onRefresh();
              forceUpdate();
            }}
            sx={{ mr: 1, height: 30 }}
          >
            Refresh
          </Button>
          <IconButton onClick={onClose} color="error" size="small" sx={{ mr: 1 }}>
            <CloseIcon />
          </IconButton>
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
      
      {/* Main content */}
      <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100% - 80px)', overflow: 'hidden' }}>
        {/* Left panel - Diagnostics */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '22%', p: 1.5, mr: 1.5,
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
            labels={["Activity", "Phase"]}
          />
        </Paper>
        
        {/* Right panel - Brain visualizations and graphs */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '90%' }}>
          {/* Time-sliced brain visualizations */}
          <Paper 
            elevation={3}
            sx={{ 
              flexGrow: 1, mb: 1.5, p: 1.5,
              backgroundColor: 'rgba(20, 20, 50, 0.8)',
              overflow: 'hidden',
              minHeight: '55%', display: 'flex'
            }}
          >
            <TimeSlicedBrainView 
              brain1={brain1}
              brain2={brain2}
              timeSlices={timeSlices}
              generateSliceData={generateSliceData}
              settings={settings}
              updateKey={updateKey}
              labels={["Activity", "Phase"]}
            />
          </Paper>
          {/* Bottom panel - Frequency analysis */}
          <Paper 
            elevation={3}
            sx={{ 
              height: '24%', p: 1.5,
              backgroundColor: 'rgba(20, 20, 50, 0.8)'
            }}
          >
            <FrequencyAnalysisGraph 
              brain1={brain1}
              brain2={brain2}
              timeWindow={timeWindow}
              settings={settings}
              updateKey={updateKey}
              labels={["Activity", "Phase"]}
            />
          </Paper>
        </Box>
      </Box>
      {/* Footer */}
      <Paper 
        elevation={3}
        sx={{ 
          mt: 1, p: 0.75,
          backgroundColor: 'rgba(20, 20, 50, 0.8)',
          borderTop: '1px solid rgba(100, 100, 255, 0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 28
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Displaying time-sliced neural activity (Activity & Phase) across {scanInterval}ms capture window
        </Typography>
        <Box>
          <IconButton 
            size="small" color="primary"
            onClick={() => setTimeWindow(prev => Math.max(20, prev - 20))}
            sx={{ mr: 0.5 }}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" color="primary"
            onClick={() => setTimeWindow(prev => Math.min(500, prev + 20))}
            sx={{ mr: 0.5 }}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="primary">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default BrainPairDetailView;
