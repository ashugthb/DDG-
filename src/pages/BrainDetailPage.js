// BrainDetailPage.js - Standalone page for detailed brain pair analysis
// This will be used in the new tab view

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress,
  Grid,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import Head from 'next/head';

// Icons 
import BrainIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';

// Import subcomponents
import TimeSlicedBrainView from '../components/brain/TimeSlicedBrainView';
import BrainDiagnosticsPanel from '../components/brain/BrainDiagnosticsPanel';
import FrequencyAnalysisGraph from '../components/brain/FrequencyAnalysisGraph';

// Default settings if not available from context
const defaultSettings = {
  colorTheme: 'default',
  updateInterval: 1500,
  showInactiveOverlay: false
};

// Brain Detail Page - Designed to be opened in a new tab
const BrainDetailPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brainPair, setBrainPair] = useState(null);
  const [brainData, setBrainData] = useState(null);
  const [timeWindow, setTimeWindow] = useState(100);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  
  // Interval reference for real-time updates
  const updateIntervalRef = useRef(null);
  
  // Parse URL parameters on load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    try {
      // Get data from URL parameters
      const data = searchParams.get('data');
      const pair = searchParams.get('pair');
      
      if (data) {
        // Decode and parse serialized data
        const parsedData = JSON.parse(decodeURIComponent(data));
        console.log('Parsed brain pair data:', parsedData);
        
        // Load brain data for this pair
        loadBrainData(parsedData);
      } else if (pair) {
        // Alternative: use pair index directly
        const pairIndex = parseInt(pair, 10);
        console.log('Loading brain pair index:', pairIndex);
        
        // Load brain data for this pair index
        loadBrainData({ pair: pairIndex });
      } else {
        setError('No brain pair specified');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error parsing brain pair data:', err);
      setError('Invalid brain pair data');
      setLoading(false);
    }
  }, []);
  
  // Load brain data from API
  const loadBrainData = async (pairInfo) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would make an API call with the pair info
      // Make API request to get full brain data
      const response = await fetch('/api/brain-data', {
        cache: 'no-store', // Ensure we get fresh data every time
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load brain data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.brainData) {
        throw new Error('Invalid data format from API');
      }
      
      // Store the full brain data
      setBrainData(data.brainData);
      
      // Extract the specific brain pair
      const brains = data.brainData.map(brainData => ({
        id: brainData.id,
        isActive: brainData.isActive || false,
        channels: brainData.channels || [],
        model: brainData.model || 'Unknown',
        serialNumber: brainData.serialNumber || 'Unknown',
        scanInterval: brainData.scanInterval || 100,
        pulseTime: Math.random() * Math.PI * 2,
      }));
      
      // Determine which brains to show based on the pair info
      let brain1, brain2;
      
      if (pairInfo.brain1Id !== undefined && pairInfo.brain2Id !== undefined) {
        // Direct brain IDs provided
        brain1 = brains.find(b => b.id === pairInfo.brain1Id) || null;
        brain2 = brains.find(b => b.id === pairInfo.brain2Id) || null;
      } else if (pairInfo.pair !== undefined) {
        // Pair index provided - calculate brains
        const pairIndex = pairInfo.pair;
        const startIndex = pairIndex * 2;
        
        brain1 = brains[startIndex] || null;
        brain2 = brains[startIndex + 1] || null;
      }
      
      // Update brain animations
      const animatedPair = [
        brain1 ? { ...brain1, pulseTime: Date.now() / 1000 } : null,
        brain2 ? { ...brain2, pulseTime: Date.now() / 1000 } : null
      ];
      
      // Set the brain pair
      setBrainPair(animatedPair);
      setLastUpdated(new Date());
      setLoading(false);
      
      // Show success notification
      setNotification({
        open: true,
        message: "Brain data loaded successfully",
        severity: "success"
      });
      
    } catch (err) {
      console.error('Error loading brain data:', err);
      setError(err.message || 'Failed to load brain data');
      setLoading(false);
      
      // Show error notification
      setNotification({
        open: true,
        message: `Error: ${err.message}`,
        severity: "error"
      });
    }
  };
  
  // Set up real-time updates with the same interval as the main dashboard
  useEffect(() => {
    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Set up new interval with current settings
    updateIntervalRef.current = setInterval(async () => {
      // Only reload if we have a valid brain pair
      if (brainPair && brainPair[0]) {
        const pairInfo = {
          brain1Id: brainPair[0]?.id,
          brain2Id: brainPair[1]?.id
        };
        await loadBrainData(pairInfo);
      }
    }, settings.updateInterval);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [brainPair, settings.updateInterval]);
  
  // Load settings from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('brainSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);
  
  // Calculate time slices based on scan interval
  const timeSlices = useMemo(() => {
    const scanInterval = brainPair?.[0]?.scanInterval || 100;
    const sliceSize = scanInterval / 5;
    
    return Array.from({ length: 5 }, (_, i) => ({
      start: i * sliceSize,
      end: (i + 1) * sliceSize,
      label: `${Math.round(i * sliceSize)}ms - ${Math.round((i + 1) * sliceSize)}ms`
    }));
  }, [brainPair]);
  
  // Generate slice data function
  const generateSliceData = (brain, timeSlice) => {
    if (!brain || !brain.channels) return [];
    
    const sliceChannels = brain.channels.map(channel => {
      // In a real app, this would use actual time-sliced data
      const sliceIndex = timeSlices.indexOf(timeSlice);
      let activityScale = 1;
      
      // Make some time slices more active than others for visual effect
      switch(sliceIndex) {
        case 0: activityScale = 0.4; break; // Early slice, less activity
        case 2: activityScale = 1.2; break; // Middle slice, more activity
        case 4: activityScale = 0.6; break; // Late slice, medium activity
        default: activityScale = 0.8;
      }
      
      return {
        ...channel,
        activity: Math.min(100, Math.max(0, Math.floor(channel.activity * activityScale))),
        transitions: Math.floor(channel.transitions * activityScale)
      };
    });
    
    return sliceChannels;
  };
  
  // Get brain statistics for display
  const getStats = (brain) => {
    if (!brain) return { activeChannels: 0, totalTransitions: 0, currentTransitions: 0 };
    
    const activeChannels = brain.channels ? brain.channels.filter(ch => ch.activity > 0).length : 0;
    const totalTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.totalTransitions || 0), 0) : 0;
    const currentTransitions = brain.channels ? 
      brain.channels.reduce((sum, ch) => sum + (ch.transitions || 0), 0) : 0;
      
    return { activeChannels, totalTransitions, currentTransitions };
  };
  
  // Calculate stats
  const brain1Stats = useMemo(() => 
    getStats(brainPair?.[0]), [brainPair]
  );
  
  const brain2Stats = useMemo(() => 
    getStats(brainPair?.[1]), [brainPair]
  );
  
  // Animation loop to update pulse times
  useEffect(() => {
    if (!brainPair) return;
    
    let animationRunning = true;
    let localBrainPair = [...brainPair];
    
    // Animation function
    const animate = () => {
      if (!animationRunning) return;
      
      // Update pulse times for smooth animation
      localBrainPair = localBrainPair.map(brain => {
        if (!brain) return null;
        return {
          ...brain,
          pulseTime: (brain.pulseTime || 0) + 0.02
        };
      });
      
      // Update state for animation
      setBrainPair(localBrainPair);
      
      requestAnimationFrame(animate);
    };
    
    // Start animation
    const animationFrame = requestAnimationFrame(animate);
    
    return () => {
      animationRunning = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [brainPair]);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (brainPair) {
      const pairInfo = {
        brain1Id: brainPair[0]?.id,
        brain2Id: brainPair[1]?.id
      };
      await loadBrainData(pairInfo);
    }
  };
  
  // Handle close - return to main dashboard
  const handleClose = () => {
    window.close(); // Close tab
    // Fallback if window.close() doesn't work (often blocked by browsers)
    window.location.href = '/';
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Loading state
  if (loading && !brainPair) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading brain data...
        </Typography>
      </Container>
    );
  }
  
  // Error state
  if (error && !brainPair) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Brain Data
        </Typography>
        <Typography variant="body1">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => window.location.href = '/'}
        >
          Return to Dashboard
        </Button>
      </Container>
    );
  }
  
  // Extract brain data for display
  const brain1 = brainPair?.[0];
  const brain2 = brainPair?.[1];
  const scanInterval = brain1?.scanInterval || 100;
  
  return (
    <>
      <Head>
        <title>
          {brain1 && brain2 
            ? `Brain ${brain1.id + 1} & ${brain2.id + 1} Analysis` 
            : 'Brain Pair Analysis'}
        </title>
      </Head>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'rgba(10, 10, 25, 1)'
      }}>
        {/* Header AppBar */}
        <AppBar position="static" 
          sx={{ 
            backgroundColor: 'rgba(20, 20, 50, 0.8)',
            borderBottom: '1px solid rgba(100, 100, 255, 0.2)'
          }}
        >
          <Toolbar>
            <BrainIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
            <Typography variant="h5" color="primary.main" sx={{ flexGrow: 1 }}>
              Detailed Brain Pair Analysis
            </Typography>
            
            <Chip 
              label={`Brain ${brain1 ? brain1.id + 1 : '?'} & Brain ${brain2 ? brain2.id + 1 : '?'}`} 
              color="secondary" 
              size="small"
              sx={{ mr: 2 }}
            />
            
            <Chip 
              icon={<TimerIcon fontSize="small" />}
              label={`Scan: ${scanInterval}ms`} 
              size="small"
              sx={{ mr: 2 }}
            />
            
            <Button 
              startIcon={<RefreshIcon />}
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            
            <IconButton 
              onClick={handleClose} 
              color="error" 
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Main content */}
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
          <Grid container spacing={2}>
            {/* Left panel - Diagnostics */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  height: '100%',
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
                />
              </Paper>
            </Grid>
            
            {/* Right panels - Visualizations */}
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                {/* Time-sliced brain visualizations */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={3}
                    sx={{ 
                      p: 2,
                      minHeight: '500px',
                      backgroundColor: 'rgba(20, 20, 50, 0.8)',
                    }}
                  >
                    <TimeSlicedBrainView 
                      brain1={brain1}
                      brain2={brain2}
                      timeSlices={timeSlices}
                      generateSliceData={generateSliceData}
                      settings={settings}
                    />
                  </Paper>
                </Grid>
                
                {/* Frequency analysis */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={3}
                    sx={{ 
                      p: 2, 
                      height: '300px',
                      backgroundColor: 'rgba(20, 20, 50, 0.8)'
                    }}
                  >
                    <FrequencyAnalysisGraph 
                      brain1={brain1}
                      brain2={brain2}
                      timeWindow={timeWindow}
                      settings={settings}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
        
        {/* Footer */}
        <Paper 
          elevation={3}
          sx={{ 
            p: 1, 
            backgroundColor: 'rgba(20, 20, 50, 0.8)',
            borderTop: '1px solid rgba(100, 100, 255, 0.2)',
            textAlign: 'center'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Displaying time-sliced neural activity across {scanInterval}ms capture window
            {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </Typography>
        </Paper>
      </Box>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BrainDetailPage;