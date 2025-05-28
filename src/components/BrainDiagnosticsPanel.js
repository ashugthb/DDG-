// BrainDiagnosticsPanel.js - Futuristic diagnostic information for brain pair

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
  Tooltip,
  Fade
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
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';

// Custom styled components
const GlowingCard = ({ children, borderColor = '#4a7bff', glow = true }) => (
  <Paper elevation={0} sx={{
    position: 'relative',
    borderRadius: '12px',
    background: 'linear-gradient(145deg, rgba(18, 25, 55, 0.8), rgba(10, 15, 35, 0.9))',
    border: `1px solid ${borderColor}`,
    boxShadow: glow ? `0 0 15px ${borderColor}80` : 'none',
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
    },
    p: 1.5,
    mb: 2
  }}>
    {children}
  </Paper>
);

const NeonDivider = () => (
  <Divider sx={{
    my: 2,
    background: 'linear-gradient(90deg, transparent, #4a7bff, transparent)',
    height: '1px',
    border: 'none'
  }} />
);

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
        background: 'linear-gradient(90deg, #1a237e, #4a148c)',
        '& .MuiLinearProgress-bar': {
          borderRadius: 4,
          background: value > 75 ? 'linear-gradient(90deg, #ff416c, #ff4b2b)' : 
                     value > 50 ? 'linear-gradient(90deg, #ffb347, #ffcc33)' : 
                     value > 20 ? 'linear-gradient(90deg, #2196f3, #21cbf3)' : 
                                  'linear-gradient(90deg, #00c6ff, #0072ff)',
          boxShadow: value > 50 ? '0 0 8px rgba(255, 255, 255, 0.6)' : 'none'
        }
      }}
    />
    <Box sx={{ 
      position: 'absolute', 
      right: 0, 
      top: -2, 
      fontSize: '0.6rem', 
      color: '#a0b0ff',
      fontWeight: 'bold'
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
      <Typography variant="body2" color="text.disabled" sx={{ 
        fontStyle: 'italic', 
        mt: 1,
        textAlign: 'center',
        py: 1,
        background: 'rgba(30, 30, 60, 0.3)',
        borderRadius: '6px'
      }}>
        No active channels detected
      </Typography>
    );
  }
  
  return (
    <List dense disablePadding sx={{ mt: 1, background: 'rgba(20, 25, 60, 0.2)', borderRadius: '8px' }}>
      {topChannels.map((channel, index) => (
        <ListItem key={index} sx={{ py: 0.5, borderBottom: '1px solid rgba(80, 100, 200, 0.1)' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SignalCellularAltIcon 
              fontSize="small"
              sx={{
                color: channel.activity > 75 ? "#ff416c" : channel.activity > 50 ? "#ffb347" : "#00c6ff",
                filter: channel.activity > 50 ? 'drop-shadow(0 0 4px currentColor)' : 'none'
              }}
            />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" component="span" sx={{ 
                  mr: 1,
                  fontWeight: channel.activity > 50 ? 'bold' : 'normal',
                  color: '#e0e0ff'
                }}>
                  {channel.name || `CH${channel.id}`}
                </Typography>
                <Chip 
                  size="small"
                  label={`${channel.transitions || 0} trans`}
                  sx={{ 
                    height: 20, 
                    background: 'rgba(40, 45, 90, 0.7)',
                    border: '1px solid rgba(100, 120, 220, 0.3)',
                    color: '#b0c0ff',
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
          />
        </ListItem>
      ))}
      
      {sortedChannels.length > limit && (
        <ListItem sx={{ 
          py: 0.5, 
          justifyContent: 'center',
          background: 'rgba(30, 35, 70, 0.3)',
          borderTop: '1px solid rgba(80, 100, 200, 0.1)'
        }}>
          <Typography variant="caption" sx={{ color: '#8090ff', fontWeight: 'bold' }}>
            +{sortedChannels.length - limit} more channels
          </Typography>
        </ListItem>
      )}
    </List>
  );
});

// Status indicator component
const StatusIndicator = memo(({ status }) => {
  let color = "#4a7bff";
  let icon = <InfoIcon fontSize="small" />;
  
  if (status === "success" || status === "active" || status === "good") {
    color = "#00e676";
    icon = <CheckCircleIcon fontSize="small" />;
  } else if (status === "warning") {
    color = "#ffca28";
    icon = <WarningIcon fontSize="small" />;
  } else if (status === "error" || status === "inactive") {
    color = "#ff5252";
    icon = <ErrorOutlineIcon fontSize="small" />;
  }
  
  return (
    <Chip 
      icon={icon} 
      size="small" 
      label={status.toUpperCase()} 
      sx={{ 
        height: 24,
        background: 'rgba(30, 35, 70, 0.7)',
        border: `1px solid ${color}`,
        color: color,
        fontWeight: 'bold',
        boxShadow: `0 0 8px ${color}40`,
        '& .MuiChip-icon': {
          color: color
        }
      }}
    />
  );
});

// Brain details section
const BrainDetails = memo(({ brain, stats }) => {
  if (!brain) return null;
  
  const status = brain.isActive ? "active" : "inactive";
  const healthStatus = stats.totalTransitions > 1000 ? "good" : stats.totalTransitions > 0 ? "warning" : "error";
  const borderColor = brain.isActive ? '#00e676' : '#ff5252';
  
  return (
    <GlowingCard borderColor={borderColor}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          color: '#e0f0ff',
          letterSpacing: '0.5px'
        }}>
          <BiotechIcon fontSize="small" sx={{ mr: 1, color: borderColor }} />
          Neural Unit {brain.id + 1}
        </Typography>
        <StatusIndicator status={status} />
      </Box>
      
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScienceIcon fontSize="small" sx={{ mr: 0.5, color: '#8090ff' }} />
            <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Model:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3, color: '#e0f0ff' }}>
            {brain.model || "Unknown"}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MemoryIcon fontSize="small" sx={{ mr: 0.5, color: '#8090ff' }} />
            <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Serial:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3, color: '#e0f0ff' }}>
            {brain.serialNumber || "Unknown"}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SignalCellularAltIcon fontSize="small" sx={{ mr: 0.5, color: '#8090ff' }} />
            <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Active Channels:</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3, color: '#e0f0ff' }}>
            {stats.activeChannels}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NetworkCheckIcon fontSize="small" sx={{ mr: 0.5, color: '#8090ff' }} />
            <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Signal Health:</Typography>
          </Box>
          <Box sx={{ ml: 3 }}>
            <StatusIndicator status={healthStatus} />
          </Box>
        </Grid>
      </Grid>
      
      <Accordion disableGutters elevation={0} sx={{ 
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        border: '1px solid rgba(80, 100, 200, 0.2)',
        borderRadius: '8px !important',
        mt: 1
      }}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: '#8090ff' }} />}
          sx={{ 
            p: '0 8px',
            minHeight: 'unset',
            '& .MuiAccordionSummary-content': {
              margin: 0,
              alignItems: 'center'
            }
          }}
        >
          <ToggleOnIcon fontSize="small" sx={{ mr: 1, color: '#00c6ff' }} />
          <Typography variant="body2" sx={{ color: '#00c6ff', fontWeight: 'bold' }}>
            Channel Activity
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 1 }}>
          <ChannelStatusList channels={brain.channels} limit={5} />
        </AccordionDetails>
      </Accordion>
    </GlowingCard>
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
  
  const borderColor = diagnosticData.systemHealth === 'good' ? '#00e676' : 
                     diagnosticData.systemHealth === 'warning' ? '#ffca28' : 
                     '#ff5252';
  
  return (
    <Box sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #0c1027 0%, #1a1f4b 100%)',
      p: 2,
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 30, 0.5)',
      border: '1px solid rgba(80, 100, 200, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #00c6ff, #0072ff, #00c6ff)',
        backgroundSize: '200% auto',
        animation: 'gradientShift 3s linear infinite',
      }
    }}>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        `}
      </style>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ScienceIcon sx={{ 
          fontSize: 32, 
          mr: 1.5, 
          color: '#4a7bff',
          filter: 'drop-shadow(0 0 6px #4a7bff)'
        }} />
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #e0f0ff, #a0c0ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(100, 150, 255, 0.5)'
        }}>
          NEURAL DIAGNOSTICS
        </Typography>
      </Box>
      
      {/* System overview */}
      <GlowingCard borderColor={borderColor} glow={diagnosticData.systemHealth !== 'error'}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 'bold',
            color: '#e0f0ff',
            letterSpacing: '0.5px'
          }}>
            <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            System Overview
          </Typography>
          <StatusIndicator status={diagnosticData.systemHealth} />
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Box sx={{ 
              background: 'rgba(30, 35, 70, 0.4)',
              borderRadius: '8px',
              p: 1.5,
              border: '1px solid rgba(80, 100, 200, 0.2)',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DevicesIcon fontSize="small" sx={{ mr: 1, color: '#8090ff' }} />
                <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Active Devices</Typography>
              </Box>
              <Typography variant="h5" sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                color: '#e0f0ff',
                textShadow: '0 0 8px rgba(100, 150, 255, 0.5)'
              }}>
                {diagnosticData.activeDevices}<Typography variant="caption" sx={{ color: '#8090ff', ml: 0.5 }}>/2</Typography>
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ 
              background: 'rgba(30, 35, 70, 0.4)',
              borderRadius: '8px',
              p: 1.5,
              border: '1px solid rgba(80, 100, 200, 0.2)',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SignalCellularAltIcon fontSize="small" sx={{ mr: 1, color: '#8090ff' }} />
                <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Active Channels</Typography>
              </Box>
              <Typography variant="h5" sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                color: '#e0f0ff',
                textShadow: '0 0 8px rgba(100, 150, 255, 0.5)'
              }}>
                {diagnosticData.totalActiveChannels}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ 
              background: 'rgba(30, 35, 70, 0.4)',
              borderRadius: '8px',
              p: 1.5,
              border: '1px solid rgba(80, 100, 200, 0.2)',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeFilledIcon fontSize="small" sx={{ mr: 1, color: '#8090ff' }} />
                <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Current Transitions</Typography>
              </Box>
              <Typography variant="h5" sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                color: '#e0f0ff',
                textShadow: '0 0 8px rgba(100, 150, 255, 0.5)'
              }}>
                {diagnosticData.currentTransitions}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ 
              background: 'rgba(30, 35, 70, 0.4)',
              borderRadius: '8px',
              p: 1.5,
              border: '1px solid rgba(80, 100, 200, 0.2)',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon fontSize="small" sx={{ mr: 1, color: '#8090ff' }} />
                <Typography variant="body2" sx={{ color: '#a0b0ff' }}>Total Transitions</Typography>
              </Box>
              <Typography variant="h5" sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                color: '#e0f0ff',
                textShadow: '0 0 8px rgba(100, 150, 255, 0.5)'
              }}>
                {formatNumber(diagnosticData.totalTransitions)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </GlowingCard>
      
      {/* Brain 1 details */}
      {brain1 && (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: '#00c6ff',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center'
          }}>
            <BiotechIcon fontSize="small" sx={{ mr: 1 }} />
            Neural Unit {brain1.id + 1}
          </Typography>
          <Fade in={true} timeout={800}>
            <Box>
              <BrainDetails brain={brain1} stats={safeStats1} />
            </Box>
          </Fade>
        </>
      )}
      
      {/* Brain 2 details */}
      {brain2 && (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: '#ff6ec7',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center'
          }}>
            <BiotechIcon fontSize="small" sx={{ mr: 1 }} />
            Neural Unit {brain2.id + 1}
          </Typography>
          <Fade in={true} timeout={1000}>
            <Box>
              <BrainDetails brain={brain2} stats={safeStats2} />
            </Box>
          </Fade>
        </>
      )}
      
      {/* Configuration Info */}
      <GlowingCard borderColor="#9d4edd">
        <Accordion 
          disableGutters 
          elevation={0} 
          sx={{ 
            backgroundColor: 'transparent',
            '&:before': { display: 'none' },
            boxShadow: 'none'
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: '#9d4edd' }} />}
            sx={{ 
              p: 0,
              minHeight: 'unset',
              '& .MuiAccordionSummary-content': {
                margin: 0,
                alignItems: 'center'
              }
            }}
          >
            <SettingsIcon fontSize="small" sx={{ mr: 1, color: '#9d4edd' }} />
            <Typography variant="body2" sx={{ color: '#c77dff', fontWeight: 'bold' }}>
              Device Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pt: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box sx={{ 
                  background: 'rgba(40, 25, 70, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  border: '1px solid rgba(157, 77, 221, 0.3)',
                  height: '100%'
                }}>
                  <Typography variant="caption" sx={{ color: '#b39ddb', display: 'block', mb: 0.5 }}>
                    Sample Rate
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: '#e0d6ff',
                    fontSize: '1.1rem'
                  }}>
                    {getSampleRateLabel(brain1?.sampleRate || 8)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  background: 'rgba(40, 25, 70, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  border: '1px solid rgba(157, 77, 221, 0.3)',
                  height: '100%'
                }}>
                  <Typography variant="caption" sx={{ color: '#b39ddb', display: 'block', mb: 0.5 }}>
                    Sample Depth
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: '#e0d6ff',
                    fontSize: '1.1rem'
                  }}>
                    {formatNumber(brain1?.sampleDepth || 200000)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  background: 'rgba(40, 25, 70, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  border: '1px solid rgba(157, 77, 221, 0.3)',
                  height: '100%'
                }}>
                  <Typography variant="caption" sx={{ color: '#b39ddb', display: 'block', mb: 0.5 }}>
                    Scan Interval
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: '#e0d6ff',
                    fontSize: '1.1rem'
                  }}>
                    {brain1?.scanInterval || 100}ms
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  background: 'rgba(40, 25, 70, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  border: '1px solid rgba(157, 77, 221, 0.3)',
                  height: '100%'
                }}>
                  <Typography variant="caption" sx={{ color: '#b39ddb', display: 'block', mb: 0.5 }}>
                    Voltage Threshold
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: '#e0d6ff',
                    fontSize: '1.1rem'
                  }}>
                    {brain1?.voltageThreshold || 0.98}V
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </GlowingCard>
      
      <Box sx={{ 
        mt: 3, 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Chip 
          label="SYSTEM NOMINAL" 
          size="small"
          sx={{ 
            background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.2), rgba(0, 230, 118, 0.1))',
            border: '1px solid rgba(0, 230, 118, 0.4)',
            color: '#00e676',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            letterSpacing: '0.5px'
          }}
        />
        <Typography variant="caption" sx={{ 
          color: '#8090ff',
          fontWeight: 'bold',
          letterSpacing: '0.5px'
        }}>
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