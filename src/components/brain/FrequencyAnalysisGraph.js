// FrequencyAnalysisGraph.js
import React, { useMemo, memo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Paper sx={{
        backdropFilter: 'blur(8px)',
        background: 'rgba(15, 20, 30, 0.85)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        p: 2,
      }}>
        <Typography variant="subtitle2" sx={{ color: '#66ccff' }}>{`${label} Hz`}</Typography>
        {payload.map((entry, i) => (
          <Typography key={i} variant="body2" sx={{ color: entry.color }}>
            {`Brain ${entry.dataKey === 'brain1' ? '1' : '2'}: ${entry.value.toFixed(2)} μV`}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const generateFrequencyData = (brain, timeWindow) => {
  const data = [];
  const activeChannels = brain?.channels?.filter(ch => ch.activity > 0) || [];
  const activitySum = activeChannels.reduce((sum, ch) => sum + (ch.activity || 0), 0);
  const activityFactor = Math.min(1, Math.max(0.1, activitySum / 1000));
  for (let freq = 1; freq <= 100; freq++) {
    let amplitude = 0;
    if (freq <= 4) amplitude = 20 + Math.random() * 15 * activityFactor;
    else if (freq <= 8) amplitude = 15 + Math.random() * 10 * activityFactor;
    else if (freq <= 13) amplitude = 25 + Math.random() * 20 * activityFactor;
    else if (freq <= 30) amplitude = 10 + Math.random() * 15 * activityFactor;
    else amplitude = 5 + Math.random() * 8 * activityFactor * (100 - freq) / 70;
    if (freq === 10) amplitude *= 1.5;
    if (freq === 20) amplitude *= 1.2;
    if (freq === 40) amplitude *= 1.3;
    data.push({ frequency: freq, amplitude });
  }
  return data;
};

const FrequencyAnalysisGraph = ({ brain1, brain2, timeWindow }) => {
  const [chartType, setChartType] = useState('area');
  const [updateCounter, setUpdateCounter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setUpdateCounter(prev => prev + 1);
        setIsAnimating(false);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const brain1FreqData = useMemo(() => generateFrequencyData(brain1, timeWindow), [brain1, timeWindow, updateCounter]);
  const brain2FreqData = useMemo(() => generateFrequencyData(brain2, timeWindow), [brain2, timeWindow, updateCounter]);

  const combinedData = useMemo(() => {
    return brain1FreqData.map((item, i) => ({
      frequency: item.frequency,
      brain1: item.amplitude,
      brain2: brain2FreqData[i]?.amplitude || 0
    }));
  }, [brain1FreqData, brain2FreqData]);

  return (
    <Box sx={{
      marginTop: -12,
      height: '150%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0b0e20',
      borderRadius: 3,
      boxShadow: '0 0 15px #0ff3',
      p: 2
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ color: '#00eaff' }}>Frequency Analysis</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup value={chartType} exclusive onChange={(e, val) => val && setChartType(val)} size="small">
            <ToggleButton value="line"><TimelineIcon sx={{ color: '#0ff' }} /></ToggleButton>
            <ToggleButton value="area"><ShowChartIcon sx={{ color: '#0f0' }} /></ToggleButton>
            <ToggleButton value="bar"><BarChartIcon sx={{ color: '#f0f' }} /></ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => setUpdateCounter(prev => prev + 1)}><RefreshIcon sx={{ color: '#aaa' }} /></IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton><DownloadIcon sx={{ color: '#aaa' }} /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {isAnimating && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              background: 'linear-gradient(to right, rgba(0,255,255,0.2), transparent)',
              animation: 'sweep 0.6s ease-in-out',
              '@keyframes sweep': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }}
          />
        )}

        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="frequency" tick={{ fill: '#aaa' }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="brain1" stroke="#00eaff" fill="rgba(0,234,255,0.4)" />
              <Area type="monotone" dataKey="brain2" stroke="#98ff98" fill="rgba(152,255,152,0.3)" />
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="frequency" tick={{ fill: '#aaa' }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="brain1" stroke="#00eaff" dot={false} />
              <Line type="monotone" dataKey="brain2" stroke="#98ff98" dot={false} />
            </LineChart>
          ) : (
            <BarChart data={combinedData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="frequency" tick={{ fill: '#aaa' }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="brain1" fill="#00eaff" />
              <Bar dataKey="brain2" fill="#98ff98" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default memo(FrequencyAnalysisGraph);
