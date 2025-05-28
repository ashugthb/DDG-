// FrequencyAnalysisGraph.js - Frequency analysis visualization for brain activity

import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip
} from '@mui/material';

// Import recharts components for visualization
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Icons
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={3}
        sx={{
          backgroundColor: 'rgba(15, 15, 35, 0.9)',
          border: '1px solid rgba(80, 120, 255, 0.3)',
          p: 1.5,
        }}
      >
        <Typography variant="subtitle2" color="primary.light">
          {`${label} Hz`}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" style={{ color: entry.color }}>
            {`Brain ${entry.dataKey === 'brain1' ? '1' : '2'}: ${entry.value.toFixed(2)} μV`}
          </Typography>
        ))}
      </Paper>
    );
  }

  return null;
};

// Generate mock frequency data for demonstration
const generateFrequencyData = (brain, timeWindow) => {
  if (!brain) return [];
  
  // For demo, create frequency bands (0-100 Hz)
  // In a real application, this would be FFT data from actual brain signals
  const data = [];
  
  // Use active channels to influence the frequency amplitudes
  const activeChannels = brain.channels?.filter(ch => ch.activity > 0) || [];
  const activitySum = activeChannels.reduce((sum, ch) => sum + (ch.activity || 0), 0);
  
  // Base factor affected by brain activity level
  const activityFactor = Math.min(1, Math.max(0.1, activitySum / 1000));
  
  // Create frequency bands with mock data
  for (let freq = 1; freq <= 100; freq++) {
    let amplitude = 0;
    
    // Create realistic brain wave patterns with random variations
    // Low frequencies (1-4 Hz)
    if (freq <= 4) {
      amplitude = 20 + Math.random() * 15 * activityFactor;
    }
    // Mid-low frequencies (4-8 Hz)
    else if (freq <= 8) {
      amplitude = 15 + Math.random() * 10 * activityFactor;
    }
    // Mid frequencies (8-13 Hz)
    else if (freq <= 13) {
      amplitude = 25 + Math.random() * 20 * activityFactor;
    }
    // Mid-high frequencies (13-30 Hz)
    else if (freq <= 30) {
      amplitude = 10 + Math.random() * 15 * activityFactor;
    }
    // High frequencies (30-100 Hz)
    else {
      amplitude = 5 + Math.random() * 8 * activityFactor * (100 - freq) / 70;
    }
    
    // Add some peaks for visual interest
    if (freq === 10) amplitude *= 1.5; // Peak at 10Hz
    if (freq === 20) amplitude *= 1.2; // Peak at 20Hz
    if (freq === 40) amplitude *= 1.3; // Peak at 40Hz
    
    data.push({
      frequency: freq,
      amplitude: amplitude
    });
  }
  
  return data;
};

// Main component
const FrequencyAnalysisGraph = ({ 
  brain1, 
  brain2, 
  timeWindow, 
  settings 
}) => {
  const [chartType, setChartType] = useState('area');
  const [updateCounter, setUpdateCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const chartRef = useRef(null);
  
  // Auto-update every 2 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setUpdateCounter(prev => prev + 1);
      }, 100); // Small delay before actual data update to allow animation to start
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Reset animation state after data update
  useEffect(() => {
    if (isAnimating) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 800); // Animation duration
      return () => clearTimeout(timeout);
    }
  }, [isAnimating]);
  
  // Generate mock frequency data for both brains
  const brain1FreqData = useMemo(() => 
    generateFrequencyData(brain1, timeWindow), [brain1, timeWindow, updateCounter]);
  
  const brain2FreqData = useMemo(() => 
    generateFrequencyData(brain2, timeWindow), [brain2, timeWindow, updateCounter]);
  
  // Combine data for chart
  const combinedData = useMemo(() => {
    if (!brain1FreqData.length && !brain2FreqData.length) {
      // Return empty array with fallback structure
      return Array.from({ length: 100 }, (_, i) => ({
        frequency: i + 1,
        brain1: 0,
        brain2: 0
      }));
    }
    
    return brain1FreqData.map((item, index) => ({
      frequency: item.frequency,
      brain1: item.amplitude,
      brain2: brain2FreqData[index]?.amplitude || 0
    }));
  }, [brain1FreqData, brain2FreqData]);
  
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };
  
  // Manual refresh handler
  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setUpdateCounter(prev => prev + 1);
    }, 100);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1
      }}>
        <Typography variant="h6" color="primary.main">
          Frequency Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            sx={{ mr: 1 }}
          >
            <ToggleButton value="line">
              <Tooltip title="Line Chart">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="area">
              <Tooltip title="Area Chart">
                <ShowChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="bar">
              <Tooltip title="Bar Chart">
                <BarChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Tooltip title="Refresh Data">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Data">
            <IconButton size="small">
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Chart with animation wrapper */}
      <Box 
        ref={chartRef}
        sx={{ 
          flexGrow: 1, 
          width: '100%', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animation overlay */}
        {isAnimating && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
              background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)',
              animation: 'sweep 0.8s ease-out',
              '@keyframes sweep': {
                '0%': {
                  transform: 'translateX(-100%)',
                },
                '100%': {
                  transform: 'translateX(100%)',
                }
              }
            }}
          />
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart
              data={combinedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="frequency" 
                label={{ 
                  value: 'Frequency (Hz)', 
                  position: 'insideBottomRight', 
                  offset: -10,
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                label={{ 
                  value: 'Amplitude (μV)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="brain1" 
                name={`Brain ${brain1?.id !== undefined ? brain1.id + 1 : 1}`}
                stroke="#8884d8" 
                fill="rgba(136, 132, 216, 0.6)" 
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                dataKey="brain2" 
                name={`Brain ${brain2?.id !== undefined ? brain2.id + 1 : 2}`}
                stroke="#82ca9d" 
                fill="rgba(130, 202, 157, 0.6)" 
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart
              data={combinedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="frequency" 
                label={{ 
                  value: 'Frequency (Hz)', 
                  position: 'insideBottomRight', 
                  offset: -10,
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                label={{ 
                  value: 'Amplitude (μV)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="brain1" 
                name={`Brain ${brain1?.id !== undefined ? brain1.id + 1 : 1}`}
                stroke="#8884d8" 
                activeDot={{ r: 6 }}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="brain2" 
                name={`Brain ${brain2?.id !== undefined ? brain2.id + 1 : 2}`}
                stroke="#82ca9d"
                activeDot={{ r: 6 }}
                dot={false}
              />
            </LineChart>
          ) : (
            // Bar chart option would go here (not implemented for brevity)
            <LineChart
              data={combinedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="frequency" 
                label={{ 
                  value: 'Frequency (Hz)', 
                  position: 'insideBottomRight', 
                  offset: -10,
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                label={{ 
                  value: 'Amplitude (μV)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'rgba(255,255,255,0.7)'
                }}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="brain1" 
                name={`Brain ${brain1?.id !== undefined ? brain1.id + 1 : 1}`} 
                stroke="#8884d8" 
              />
              <Line 
                type="monotone" 
                dataKey="brain2" 
                name={`Brain ${brain2?.id !== undefined ? brain2.id + 1 : 2}`} 
                stroke="#82ca9d" 
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default memo(FrequencyAnalysisGraph);