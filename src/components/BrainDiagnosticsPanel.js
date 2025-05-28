// BrainDiagnosticsPanel.js - Detailed diagnostic information for brain pair

import React, { memo, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Chip,
  Paper,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip
} from '@mui/material';

// Icons
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import TimerIcon from '@mui/icons-material/Timer';
import InfoIcon from '@mui/icons-material/Info';
import StorageIcon from '@mui/icons-material/Storage';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import DevicesIcon from '@mui/icons-material/Devices';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SettingsIcon from '@mui/icons-material/Settings';

// Activity indicator for channel status
const ActivityIndicator = memo(({ value }) => (
  <Box sx={{ width: '100%', position: 'relative' }}>
    <LinearProgress
      variant="determinate"
      value={value}
      color={value > 75 ? "error" : value > 50 ? "warning" : value > 20 ? "info" : "primary"}
      sx={{ 
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(20, 20, 40, 0.6)'
      }}
    />
    <Box sx={{ 
      position: 'absolute', 
      right: 0, 
      top: -2, 
      fontSize: '0.6rem', 
      color: 'text.secondary' 
    }}>
      {value}%
    </Box>
  </Box>
));

// Channel status list
const ChannelStatusList = memo(({ channels, limit = 5 }) => {
  // Safe channels array
  const safeChannels = channels || [];
  
  // Sort channels by activity level (descending)
  const sortedChannels = useMemo(() => {
    return [...safeChannels].sort((a, b) => 
      (b.activity || 0) - (a.activity || 0)
    );
  }, [safeChannels]);
  
  // Take only the most active channels up to the limit
  const topChannels = useMemo(() => 
    sortedChannels.slice(0, limit), 
    [sortedChannels, limit]
  );
  
  if (topChannels.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 1 }}>
        No active channels detected
      </Typography>
    );
  }
  
  return (
    <List dense disablePadding sx={{ mt: 1 }}>
      {topChannels.map((channel, index) => (
        <ListItem key={index} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SignalCellularAltIcon 
              fontSize="small"
              color={channel.activity > 75 ? "error" : channel.activity > 50 ? "warning" : "primary"}
            />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                  {channel.name || `CH${channel.id}`}
                </Typography>
                <Chip 
                  size="small"
                  label={`${channel.transitions || 0} trans`}
                  color="default"
                  sx={{ 
                    height: 20, 
                    '& .MuiChip-label': { 
                      px: 1,
                      py: 0,
                      fontSize: '0.65rem'
                    }
                  }}
                />
              </Box>
            }
            secondary={<ActivityIndicator value={channel.activity || 0} />}
            primaryTypographyProps={{ fontWeight: channel.activity > 50 ? 'bold' : 'normal' }}
          />
        </ListItem>
      ))}
      
      {sortedChannels.length > limit && (
        <ListItem sx={{ py: 0.5, justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            +{sortedChannels.length - limit} more channels
          </Typography>
        </ListItem>
      )}
    </List>
  );
});

// Status indicator component
const StatusIndicator = memo(({ status }) => {
  let color = "default";
  let icon = <InfoIcon fontSize="small" />;
  
  if (status === "success" || status === "active" || status === "good") {
    color = "success";
    icon = <CheckCircleIcon fontSize="small" />;
  } else if (status === "warning") {
    color = "warning";
    icon = <WarningIcon fontSize="small" />;
  } else if (status === "error" || status === "inactive") {
    color = "error";
    icon = <ErrorOutlineIcon fontSize="small" />;
  }
  
  return (
    <Chip 
      icon={icon} 
      size="small" 
      label={status.toUpperCase()} 
      color={color}
      sx={{ height: 24 }}
    />
  );
});

// Brain details section
const BrainDetails = memo(({ brain, stats }) => {
  if (!brain) return null;
  
  const status = brain.isActive ? "active" : "inactive";
  const healthStatus = stats.totalTransitions > 1000 ? "good" : stats.totalTransitions > 0 ? "warning" : "error";
  
  return (
    <Paper elevation={2} sx={{ 
      p: 1.5, 
      mb: 2, 
      backgroundColor: 'rgba(25, 25, 60, 0.6)',
      borderLeft: `4px solid ${brain.isActive ? '#4caf50' : '#f44336'}`
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <DevicesIcon fontSize="small" sx={{ mr: 0.5 }} />
          Brain {brain.id + 1}
        </Typography>
        <StatusIndicator status={status} />
      </Box>
      
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary">Model:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3 }}>{brain.model || "Unknown"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MemoryIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary">Serial:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3 }}>{brain.serialNumber || "Unknown"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SignalCellularAltIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary">Active Channels:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3 }}>{stats.activeChannels}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NetworkCheckIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary">Signal Health:</Typography>
          </Box>
          <Box sx={{ ml: 3 }}>
            <StatusIndicator status={healthStatus} />
          </Box>
        </Grid>
      </Grid>
      
      <Accordion disableGutters elevation={0} sx={{ 
        backgroundColor: 'transparent',
        '&:before': { display: 'none' }
      }}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            p: 0,
            minHeight: 'unset',
            '& .MuiAccordionSummary-content': {
              margin: 0,
              alignItems: 'center'
            }
          }}
        >
          <ToggleOnIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
          <Typography variant="body2" color="primary.main">
            Channel Activity
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1 }}>
          <ChannelStatusList channels={brain.channels} limit={5} />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
});

// Main diagnostics panel component
const BrainDiagnosticsPanel = ({ 
  brain1, 
  brain2, 
  brain1Stats, 
  brain2Stats, 
  settings 
}) => {
  // Ensure all stats exist to prevent errors
  const safeStats1 = brain1Stats || { activeChannels: 0, totalTransitions: 0, currentTransitions: 0 };
  const safeStats2 = brain2Stats || { activeChannels: 0, totalTransitions: 0, currentTransitions: 0 };
  
  // Calculate total activity metrics - wrapped in useMemo for performance
  const diagnosticData = useMemo(() => {
    const totalActiveChannels = (safeStats1.activeChannels || 0) + (safeStats2.activeChannels || 0);
    const totalTransitions = (safeStats1.totalTransitions || 0) + (safeStats2.totalTransitions || 0);
    const currentTransitions = (safeStats1.currentTransitions || 0) + (safeStats2.currentTransitions || 0);
    
    // Overall system health calculation (simple heuristic for demo)
    const systemHealth = (() => {
      if (!brain1?.isActive && !brain2?.isActive) return "error";
      if (totalActiveChannels < 2) return "warning";
      if (totalTransitions < 100) return "warning";
      return "good";
    })();
    
    return {
      totalActiveChannels,
      totalTransitions,
      currentTransitions,
      systemHealth,
      activeDevices: (brain1?.isActive ? 1 : 0) + (brain2?.isActive ? 1 : 0)
    };
  }, [brain1, brain2, safeStats1, safeStats2]);
  
  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ 
        color: 'primary.main', 
        borderBottom: '1px solid rgba(100, 100, 255, 0.2)',
        pb: 1,
        display: 'flex',
        alignItems: 'center'
      }}>
        <InfoIcon sx={{ mr: 1 }} />
        Diagnostic Information
      </Typography>
      
      {/* System overview */}
      <Paper elevation={2} sx={{ 
        p: 1.5, 
        mb: 3, 
        backgroundColor: diagnosticData.systemHealth === 'good' ? 'rgba(0, 50, 0, 0.2)' : 
                       diagnosticData.systemHealth === 'warning' ? 'rgba(50, 50, 0, 0.2)' : 
                       'rgba(50, 0, 0, 0.2)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">System Overview</Typography>
          <StatusIndicator status={diagnosticData.systemHealth} />
        </Box>
        
        <List dense disablePadding>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DevicesIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Active Devices"
              secondary={`${diagnosticData.activeDevices}/2`}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SignalCellularAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Total Active Channels"
              secondary={diagnosticData.totalActiveChannels}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AccessTimeFilledIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Current Transitions"
              secondary={diagnosticData.currentTransitions}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <StorageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Total Transitions"
              secondary={diagnosticData.totalTransitions.toLocaleString()}
            />
          </ListItem>
        </List>
      </Paper>
      
      {/* Brain 1 details */}
      {brain1 && (
        <>
          <Typography variant="subtitle2" gutterBottom color="primary.light" sx={{ fontWeight: 'bold' }}>
            BRAIN {brain1.id + 1} DETAILS
          </Typography>
          <BrainDetails brain={brain1} stats={safeStats1} />
        </>
      )}
      
      {/* Brain 2 details */}
      {brain2 && (
        <>
          <Typography variant="subtitle2" gutterBottom color="secondary.light" sx={{ fontWeight: 'bold' }}>
            BRAIN {brain2.id + 1} DETAILS
          </Typography>
          <BrainDetails brain={brain2} stats={safeStats2} />
        </>
      )}
      
      {/* Configuration Info */}
      <Accordion 
        disableGutters 
        elevation={1} 
        sx={{ 
          mt: 2,
          backgroundColor: 'rgba(30, 30, 70, 0.4)', 
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ backgroundColor: 'rgba(40, 40, 80, 0.4)' }}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">Device Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Sample Rate:</Typography>
              <Typography variant="body2">{getSampleRateLabel(brain1?.sampleRate || 8)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Sample Depth:</Typography>
              <Typography variant="body2">{formatNumber(brain1?.sampleDepth || 200000)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Scan Interval:</Typography>
              <Typography variant="body2">{brain1?.scanInterval || 100}ms</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Voltage Threshold:</Typography>
              <Typography variant="body2">{brain1?.voltageThreshold || 0.98}V</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
          Last Updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

// Helper function to get sample rate label
function getSampleRateLabel(rateCode) {
  const rateMap = {
    0: '1 MHz',
    1: '2 MHz',
    2: '5 MHz',
    3: '10 MHz',
    4: '20 MHz',
    5: '25 MHz',
    6: '50 MHz',
    7: '80 MHz',
    8: '100 MHz',
    9: '125 MHz',
    10: '200 MHz',
    11: '250 MHz',
    12: '400 MHz'
  };
  
  return rateMap[rateCode] || 'Unknown';
}

// Helper function to format numbers
function formatNumber(num) {
  if (!num) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default memo(BrainDiagnosticsPanel);