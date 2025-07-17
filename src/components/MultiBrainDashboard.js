// MultiBrainDashboard.js - Updated with futuristic InfoPanel that displays analyzer configuration

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  memo,
  useMemo
} from "react";
import {
  Box,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Container,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  IconButton,
  Paper,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Button,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent
} from "@mui/material";
import BrainIcon from "@mui/icons-material/Psychology";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import MemoryIcon from "@mui/icons-material/Memory";
import SpeedIcon from "@mui/icons-material/Speed";
import StorageIcon from "@mui/icons-material/Storage";
import TimerIcon from "@mui/icons-material/Timer";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import DevicesIcon from "@mui/icons-material/Devices";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import ScienceIcon from "@mui/icons-material/Science";
import VerifiedIcon from "@mui/icons-material/Verified";
import ErrorIcon from "@mui/icons-material/Error";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TuneIcon from "@mui/icons-material/Tune";

import BrainVisualization from "./BrainVisualization";
import DataStatusIndicator from "./DataStatusIndicator";
import BrainPairDetailView from "./BrainPairDetailView";
import { SettingsContext } from "../pages/index";
import {
  AppContainer,
  StyledToolbar,
  FooterBar,
  HeaderButton,
  BrainCell,
  ColorScaleLegend,
  ActivityIndicator,
} from "../styles/styledComponents";
import { parseLogicData, getBrainData } from "../utils/brainUtils";

// URL for opening brain pair detail in new tab
// In development environment, use localhost
const BRAIN_DETAIL_URL = process.env.NODE_ENV === 'development' 
  ? "http://localhost:3000/brain-detail"
  : "/brain-detail"; 

// Enhanced color scales for heatmap visualization
const COLOR_SCALES = {
  default: {
    // Blue shades for no/low activity (0-0.2)
    noActivity: "#081d58", // Dark blue for no activity
    veryLow: "#0d47a1",
    low: "#1565c0",
    // Blue-green transition for low-medium activity (0.2-0.4)
    lowMedium: "#1976d2", 
    medium: "#2196f3",
    // Orange shades for medium-high activity (0.4-0.7)
    mediumHigh: "#ff9800",
    high: "#f57c00",
    veryHigh: "#e65100",
    // Red shades for very high activity (0.7-1.0)
    extreme: "#d32f2f",
    peak: "#b71c1c"
  },
  alternative: {
    // Different blue shades for alternative theme
    noActivity: "#0a1172", // Dark indigo for no activity
    veryLow: "#0f2027",
    low: "#203a43",
    // Teal transition for low-medium
    lowMedium: "#2c5364",
    medium: "#00796b",
    // Yellow-orange for medium-high
    mediumHigh: "#ffc107",
    high: "#ff9800",
    veryHigh: "#ff5722",
    // Red shades for highest activity
    extreme: "#bf360c",
    peak: "#801313"
  }
};

// Sample rate options for human-readable display
const SAMPLE_RATE_LABELS = {
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

// Helper function to get color based on activity level
const getActivityColor = (activityLevel, isActive, colorTheme = 'default') => {
  if (!isActive) return "rgba(13, 71, 161, 0.5)"; // Blue with opacity for inactive
  
  const colors = COLOR_SCALES[colorTheme] || COLOR_SCALES.default;
  
  if (activityLevel <= 0) return colors.noActivity;
  if (activityLevel < 0.1) return colors.veryLow;
  if (activityLevel < 0.2) return colors.low;
  if (activityLevel < 0.3) return colors.lowMedium;
  if (activityLevel < 0.4) return colors.medium;
  if (activityLevel < 0.6) return colors.mediumHigh;
  if (activityLevel < 0.7) return colors.high;
  if (activityLevel < 0.8) return colors.veryHigh;
  if (activityLevel < 0.9) return colors.extreme;
  return colors.peak;
};

// Enhanced InfoPanel Component with futuristic design
const EnhancedInfoPanel = memo(({ 
  showInfoPanel, 
  selectedBrain, 
  brains, 
  dataStatus, 
  settings, 
  lastUpdated, 
  toggleInfoPanel, 
  handleManualRefresh, 
  handleOpenSettings 
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Function to render a stat card with a futuristic design
  const renderStatCard = (title, value, icon, color = "primary.main", bgColor = "rgba(25, 118, 210, 0.1)") => (
    <Box 
      sx={{ 
        p: 1.5, 
        borderRadius: 2,
        border: `1px solid ${color}`,
        background: `linear-gradient(135deg, ${bgColor} 0%, rgba(10,10,30,0.3) 100%)`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30%',
          height: '2px',
          background: `linear-gradient(to right, transparent, ${color})`,
          opacity: 0.7
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: '0.75rem', opacity: 0.8 }}>
          {title}
        </Typography>
        <Box sx={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
          {icon}
        </Box>
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ 
        color: 'white', 
        fontSize: '1.25rem', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        {value}
      </Typography>
    </Box>
  );

  // Function to render a device configuration card
  const renderDeviceConfigCard = (deviceIndex) => {
    // Find device config in settings
    const deviceConfig = settings.deviceSettings && settings.deviceSettings[deviceIndex];
    
    if (!deviceConfig) return null;
    
    // Find corresponding brain data
    const brain = brains[deviceIndex];

    // Activity level calculation
    const activeChannels = brain?.channels?.filter(ch => ch.activity > 0)?.length || 0;
    const activityPercentage = brain?.isActive ? (activeChannels / (brain?.channels?.length || 1)) * 100 : 0;
    
    // Determine status color
    const statusColor = !brain?.isActive 
      ? "#f44336" // Red for inactive
      : activeChannels > 0 
        ? "#4caf50" // Green for active with activity
        : "#ff9800"; // Orange for active but no activity

    return (
      <Paper 
        elevation={3} 
        sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)',
          border: deviceConfig.enabled 
            ? `1px solid ${statusColor}` 
            : '1px solid rgba(150,150,150,0.1)',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '2px',
            background: `linear-gradient(to right, ${statusColor}, transparent)`,
            opacity: 0.7
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DevicesIcon sx={{ mr: 1, color: deviceConfig.enabled ? statusColor : 'text.disabled' }} />
            <Typography variant="h6" color={deviceConfig.enabled ? 'text.primary' : 'text.disabled'}>
              {deviceConfig.name}
            </Typography>
          </Box>
          <Chip 
            label={deviceConfig.enabled ? (brain?.isActive ? "Active" : "Inactive") : "Disabled"} 
            size="small" 
            color={deviceConfig.enabled ? (brain?.isActive ? "success" : "error") : "default"}
            icon={deviceConfig.enabled ? (brain?.isActive ? <VerifiedIcon /> : <ErrorIcon />) : <CloseIcon />}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SpeedIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">Sample Rate</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {SAMPLE_RATE_LABELS[deviceConfig.sampleRateCode] || 'Unknown'}
            </Typography>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StorageIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">Sample Depth</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {deviceConfig.sampleDepth ? deviceConfig.sampleDepth.toLocaleString() : 'Unknown'}
            </Typography>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">Scan Interval</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {deviceConfig.scanIntervalMs ? `${deviceConfig.scanIntervalMs} ms` : 'Unknown'}
            </Typography>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TuneIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">Voltage Threshold</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {deviceConfig.voltageThreshold ? `${deviceConfig.voltageThreshold.toFixed(2)}V` : 'Unknown'}
            </Typography>
          </Grid>
        </Grid>
        
        {brain?.isActive && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Activity Level</Typography>
              <Typography variant="body2" fontWeight="medium">
                {Math.round(activityPercentage)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={activityPercentage} 
              sx={{ 
                height: 8, 
                borderRadius: 1,
                backgroundColor: 'rgba(0,0,0,0.2)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${COLOR_SCALES[settings.colorTheme || 'default'].low} 0%, ${COLOR_SCALES[settings.colorTheme || 'default'].peak} 100%)`
                }
              }} 
            />
          </Box>
        )}
        
        {brain?.serialNumber && (
          <Box sx={{ 
            mt: 2, 
            p: 1, 
            borderRadius: 1, 
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            opacity: 0.7
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DeveloperBoardIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">
                S/N: {brain.serialNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MemoryIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">
                Model: {brain.model || 'Unknown'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">
                Captures: {brain.captureCount || 0}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  // Calculate summary statistics
  const activeBrainsCount = brains.filter(brain => brain.isActive).length;
  const totalChannels = brains.reduce((total, brain) => 
    total + (brain.channels?.length || 0), 0);
  const activeChannels = brains.reduce((total, brain) => 
    total + (brain.channels?.filter(ch => ch.activity > 0)?.length || 0), 0);
  
  // Determine overall system status
  let systemStatus = "Operational";
  let statusColor = "#4caf50"; // Green
  
  if (activeBrainsCount === 0) {
    systemStatus = "Offline";
    statusColor = "#f44336"; // Red
  } else if (activeBrainsCount < brains.length / 2) {
    systemStatus = "Degraded";
    statusColor = "#ff9800"; // Orange
  }

  return (
    <Box 
      sx={{
        position: "fixed",
        top: 0,
        right: showInfoPanel ? 0 : '-600px',
        bottom: 0,
        width: '600px',
        zIndex: 1200,
        background: 'linear-gradient(135deg, rgba(15,15,40,0.95) 0%, rgba(10,10,30,0.98) 100%)',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
        transition: 'right 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(100,100,255,0.2)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(100,100,255,0.2)',
          background: 'linear-gradient(90deg, rgba(20,20,50,0.7) 0%, rgba(15,15,40,0.7) 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">System Information</Typography>
        </Box>
        
        <IconButton 
          onClick={toggleInfoPanel}
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(100,100,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ 
            '& .MuiTab-root': { 
              color: 'text.secondary',
              fontSize: '0.85rem',
              minHeight: '48px'
            },
            '& .Mui-selected': { 
              color: 'primary.main' 
            },
            '& .MuiTabs-indicator': { 
              backgroundColor: 'primary.main' 
            }
          }}
        >
          <Tab 
            icon={<DashboardIcon sx={{ fontSize: '1.1rem' }} />} 
            iconPosition="start" 
            label="Dashboard" 
            sx={{ textTransform: 'none' }} 
          />
          <Tab 
            icon={<DevicesIcon sx={{ fontSize: '1.1rem' }} />} 
            iconPosition="start" 
            label="Devices" 
            sx={{ textTransform: 'none' }} 
          />
          <Tab 
            icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} 
            iconPosition="start" 
            label="Settings" 
            sx={{ textTransform: 'none' }} 
          />
        </Tabs>
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        {/* Dashboard Tab */}
        {activeTab === 0 && (
          <Box>
            {/* System Status */}
            <Box 
              sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 2,
                background: `linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)`,
                border: `1px solid ${statusColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: `linear-gradient(to right, ${statusColor}, transparent)`,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: statusColor,
                    boxShadow: `0 0 10px ${statusColor}`,
                    mr: 2,
                    animation: systemStatus === "Operational" ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { boxShadow: `0 0 0 0 rgba(76, 175, 80, 0.7)` },
                      '70%': { boxShadow: `0 0 0 10px rgba(76, 175, 80, 0)` },
                      '100%': { boxShadow: `0 0 0 0 rgba(76, 175, 80, 0)` }
                    }
                  }}
                />
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                    SYSTEM STATUS
                  </Typography>
                  <Typography variant="h6" color="white" fontWeight="bold">
                    {systemStatus}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                  LAST UPDATED
                </Typography>
                <Typography variant="body2" color="white">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                </Typography>
              </Box>
            </Box>
            
            {/* Key Stats */}
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium', color: 'primary.main' }}>
              System Overview
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                {renderStatCard(
                  "ACTIVE DEVICES", 
                  `${activeBrainsCount} / ${brains.length}`, 
                  <DevicesIcon />, 
                  "#2196f3", 
                  "rgba(33, 150, 243, 0.1)"
                )}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard(
                  "ACTIVE CHANNELS", 
                  `${activeChannels} / ${totalChannels}`, 
                  <SignalCellularAltIcon />, 
                  "#4caf50", 
                  "rgba(76, 175, 80, 0.1)"
                )}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard(
                  "DATA STATUS", 
                  dataStatus === "success" ? "Online" : dataStatus === "loading" ? "Loading" : "Error", 
                  <MemoryIcon />, 
                  dataStatus === "success" ? "#4caf50" : dataStatus === "loading" ? "#ff9800" : "#f44336",
                  dataStatus === "success" ? "rgba(76, 175, 80, 0.1)" : dataStatus === "loading" ? "rgba(255, 152, 0, 0.1)" : "rgba(244, 67, 54, 0.1)"
                )}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard(
                  "SCAN INTERVAL", 
                  `${settings.updateInterval} ms`, 
                  <TimerIcon />, 
                  "#9c27b0", 
                  "rgba(156, 39, 176, 0.1)"
                )}
              </Grid>
            </Grid>
            
            {/* Most Active Devices */}
            <Typography variant="subtitle1" sx={{ mb: 1.5, mt: 3, fontWeight: 'medium', color: 'primary.main' }}>
              Most Active Devices
            </Typography>
            
            {brains
              .map((brain, index) => ({
                brain,
                index,
                activity: brain.channels?.filter(ch => ch.activity > 0)?.length || 0
              }))
              .sort((a, b) => b.activity - a.activity)
              .slice(0, 3)
              .map(({ brain, index, activity }) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 1.5, 
                    mb: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)',
                    border: '1px solid rgba(100,100,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(33, 150, 243, 0.1)',
                        color: 'primary.main',
                        mr: 2
                      }}
                    >
                      <BrainIcon />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {settings.deviceSettings[index]?.name || `Brain ${index + 1}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {brain.serialNumber || 'Unknown'} • {brain.model || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={`${activity} active channels`}
                      size="small"
                      sx={{ 
                        bgcolor: getActivityColor(activity / 32, true, settings.colorTheme),
                        color: 'white'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            
            {/* System Actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<RefreshIcon />} 
                onClick={handleManualRefresh}
                sx={{ flexGrow: 1 }}
              >
                Refresh Data
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<SettingsIcon />} 
                onClick={handleOpenSettings}
                sx={{ flexGrow: 1 }}
              >
                Configure
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Devices Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'primary.main' }}>
              Device Configuration
            </Typography>
            
            {/* Display each device */}
            {Array.from({ length: 12 }, (_, i) => i).map(deviceIndex => 
              renderDeviceConfigCard(deviceIndex)
            )}
          </Box>
        )}
        
        {/* Settings Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'primary.main' }}>
              System Configuration
            </Typography>
            
            <Paper 
              elevation={3} 
              sx={{
                p: 2,
                mb: 3,
                background: 'linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)',
                borderRadius: 2,
                border: '1px solid rgba(100,100,255,0.2)',
              }}
            >
              <List disablePadding>
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    borderBottom: '1px solid rgba(100,100,255,0.1)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <StorageIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Data File Path" 
                    secondary={settings.dataFilePath || 'Not configured'} 
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    borderBottom: '1px solid rgba(100,100,255,0.1)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <TimerIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Update Interval" 
                    secondary={`${settings.updateInterval} milliseconds`} 
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    borderBottom: '1px solid rgba(100,100,255,0.1)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SpeedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Default Sample Rate" 
                    secondary={SAMPLE_RATE_LABELS[settings.defaultSampleRate] || 'Not configured'} 
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    borderBottom: '1px solid rgba(100,100,255,0.1)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <TuneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Default Voltage Threshold" 
                    secondary={`${settings.defaultVoltageThreshold?.toFixed(2) || '0.98'}V`} 
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                
                <ListItem 
                  sx={{ 
                    py: 1.5
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DeveloperBoardIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Group Connection" 
                    secondary={settings.useGroupedConnection ? 'Enabled' : 'Disabled'} 
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
              </List>
            </Paper>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SettingsIcon />} 
              onClick={handleOpenSettings}
              fullWidth
            >
              Open Settings Panel
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Footer */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(100,100,255,0.2)',
          background: 'linear-gradient(90deg, rgba(20,20,50,0.7) 0%, rgba(15,15,40,0.7) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {`Last data update: ${lastUpdated ? lastUpdated.toLocaleString() : 'Never'}`}
        </Typography>
        
        <Chip 
          icon={<ScienceIcon />} 
          label="Neural Analyzer v1.0" 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>
    </Box>
  );
});

// Memoized BrainVisualization to prevent unnecessary re-renders
const MemoizedBrainVis = memo(BrainVisualization);

// Memoized BrainPairDetailView
const MemoizedBrainPairDetailView = memo(BrainPairDetailView);

const MultiBrainDashboard = () => {
  // Get settings from context
  const { settings, openSettings } = useContext(SettingsContext);

  // State
  const [brains, setBrains] = useState([]);
  const [allBrainData, setAllBrainData] = useState(null);
  const [fps, setFps] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(true); // Set to true by default
  const [selectedBrainId, setSelectedBrainId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataStatus, setDataStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [clientReady, setClientReady] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  
  // State for brain pair detail view
  const [showBrainPairDetail, setShowBrainPairDetail] = useState(false);
  const [selectedBrainPair, setSelectedBrainPair] = useState(null);

  // Refs
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const fpsCounterRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const fileCheckIntervalRef = useRef(null);
  const manualRefreshRef = useRef(false);

  // Set client-ready state after mount to avoid hydration issues
  useEffect(() => {
    setClientReady(true);
    setCurrentTime(new Date().toLocaleTimeString());
    setLastUpdated(new Date());
    lastFpsTimeRef.current = Date.now();
  }, []);

  // Group brains into pairs
  const brainPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < brains.length; i += 2) {
      if (i + 1 < brains.length) {
        pairs.push([brains[i], brains[i + 1]]);
      } else {
        pairs.push([brains[i], null]); // Last brain if there's an odd number
      }
    }
    return pairs;
  }, [brains]);
  const FREQUENCY_BANDS = [
  "0–100 Hz", "500–600 Hz", "2–6 kHz", "10-50 kHz",
  "100-200 KHz", "500-600 kHz", "0.8-1.2 MHz", "10-50 MHz",
  "100-200 MHz", "500-600 MHz", "0.8-1.2 GHz", "1.94–5.31 GHz"
];

  // Initialize brains
  const initializeBrains = useCallback(async () => {
    // Initialize 12 empty brains
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      pulseTime: Math.random() * Math.PI * 2, // Different start phase for each brain
      isActive: false,
      channels: [],
      scanInterval: 100, // Default scan interval in ms
    }));
  }, []);

  // Load brain data from API endpoint with retry logic
  const loadBrainData = useCallback(async () => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second delay between retries

    const attemptLoad = async () => {
      try {
        setDataStatus("loading");

        // Use the API endpoint instead of directly fetching the file
        const response = await fetch("/api/brain-data", {
          cache: "no-store", // Ensure we get fresh data every time
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          // Handle HTTP errors
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "Failed to load brain data:",
            errorData.error || response.statusText
          );
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.brainData) {
          console.error("Invalid data format from API");
          throw new Error("Invalid data format from API");
        }

        // Successfully loaded data
        setDataStatus("success");
        setLastUpdated(new Date());

        // Log the data source (file, cache, or fallback)
        if (data.source) {
          console.log(`Data loaded from ${data.source}`);
        }

        // Show notification if using fallback data
        if (data.source === "fallback") {
          setNotification({
            open: true,
            message: "Using previous data due to file access issues",
            severity: "warning",
          });
        }

        // Return the brainData array from the response
        return data.brainData;
      } catch (error) {
        // Only retry for specific errors that might be transient
        if (
          retryCount < maxRetries &&
          (error.message.includes("ECONNRESET") ||
            error.message.includes("CONTENT_LENGTH_MISMATCH") ||
            error.message.includes("Failed to fetch"))
        ) {
          retryCount++;
          console.log(
            `Retry attempt ${retryCount} after error: ${error.message}`
          );

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attemptLoad();
        }

        // If all retries failed or error isn't retryable, propagate the error
        console.error("Error loading brain data after retries:", error);
        setDataStatus("error");

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to load data: ${error.message}`,
          severity: "error",
        });

        return null;
      }
    };

    return attemptLoad();
  }, []);

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
        serialNumber: brainDataItem?.serialNumber || "Unknown",
        model: brainDataItem?.model || "Unknown",
        captureCount: brainDataItem?.captureCount || 0,
        scanInterval: brainDataItem?.scanInterval || 100,
      };
    }

    return updatedBrains;
  }, []);


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
        const updatedBrains = updateBrainsFromData(initialBrains, initialData);
        setBrains(updatedBrains);
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
  }, [clientReady, initializeBrains, loadBrainData, settings.updateInterval, updateBrainsFromData]);

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
      loadBrainData().then((data) => {
        if (data) {
          setAllBrainData(data);
        }
      });
    }

    // Save settings to localStorage for the new tab view
    try {
      localStorage.setItem('brainSettings', JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving settings to localStorage:', err);
    }

    return () => {
      if (fileCheckIntervalRef.current) {
        clearInterval(fileCheckIntervalRef.current);
      }
    };
  }, [clientReady, loadBrainData, settings]);

  // Animation loop
  useEffect(() => {
    if (!clientReady || brains.length === 0) return;

    let animationRunning = true;
    let localBrains = [...brains];

    // Animation function
    const animate = () => {
      if (!animationRunning) return;

      // Update FPS counter
      fpsCounterRef.current += 1;
      const currentTime = Date.now();

      if (currentTime - lastFpsTimeRef.current >= 1000) {
        setFps(
          (fpsCounterRef.current * 1000) /
            (currentTime - lastFpsTimeRef.current)
        );
        fpsCounterRef.current = 0;
        lastFpsTimeRef.current = currentTime;
      }

      // Update brain data if allBrainData has changed
      if (allBrainData) {
        localBrains = updateBrainsFromData(localBrains, allBrainData);
      }

      // Always update pulse time for smooth animation
      localBrains = localBrains.map((brain) => ({
        ...brain,
        pulseTime: (brain.pulseTime || 0) + 0.02,
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

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Toggle info panel
  const toggleInfoPanel = useCallback(() => {
    setShowInfoPanel((prev) => !prev);
  }, []);

  // Select a brain for info panel
  const handleBrainSelect = useCallback((brainId) => {
    setSelectedBrainId(brainId);
    setShowInfoPanel(true);
  }, []);

  // Select a brain pair for detailed view
  const handleBrainPairSelect = useCallback((pairIndex) => {
    if (pairIndex >= 0 && pairIndex < brainPairs.length) {
      setSelectedBrainPair(brainPairs[pairIndex]);
      setShowBrainPairDetail(true);
    }
  }, [brainPairs]);

  // Open brain pair detail in new tab
  const openBrainPairInNewTab = useCallback((pairIndex) => {
    if (pairIndex >= 0 && pairIndex < brainPairs.length) {
      const pairData = brainPairs[pairIndex];
      
      // Serialize the pair data
      const serializedData = encodeURIComponent(JSON.stringify({
        pair: pairIndex,
        brain1Id: pairData[0]?.id,
        brain2Id: pairData[1]?.id
      }));
      
      // Open in a new tab/window
      window.open(`${BRAIN_DETAIL_URL}?data=${serializedData}`, '_blank');
    }
  }, [brainPairs]);

  // Close brain pair detail view
  const handleCloseBrainPairDetail = useCallback(() => {
    setShowBrainPairDetail(false);
  }, []);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    manualRefreshRef.current = true;
    const data = await loadBrainData();
    if (data) {
      setAllBrainData(data);
      setNotification({
        open: true,
        message: "Data refreshed successfully",
        severity: "success",
      });
    } else {
      setNotification({
        open: true,
        message: "Failed to refresh data",
        severity: "error",
      });
    }
  }, [loadBrainData]);

  // Get details for selected brain
  const selectedBrain = useMemo(() => {
    if (selectedBrainId === null || !brains.length) return null;
    return brains.find((brain) => brain.id === selectedBrainId);
  }, [selectedBrainId, brains]);

  // Handle fullscreen change events
  useEffect(() => {
    if (!clientReady) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [clientReady]);

  // Close notification
  const handleCloseNotification = useCallback(() => {
    setNotification({ ...notification, open: false });
  }, [notification]);

  // If not client-ready, render a minimal placeholder to avoid hydration issues
  if (!clientReady) {
    return (
      <AppContainer>
        <AppBar position="static" elevation={0} color="transparent">
          <StyledToolbar>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <BrainIcon sx={{ fontSize: 32, mr: 1, color: "primary.main" }} />
              <Typography
                variant="h4"
                component="h1"
                color="primary"
                sx={{ flexGrow: 1 }}
              >
                Multi-Brain Neural Activity Monitor
              </Typography>
            </Box>
          </StyledToolbar>
        </AppBar>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Typography>Loading visualization...</Typography>
        </Box>
      </AppContainer>
    );
  }

  return (
    <AppContainer ref={containerRef} sx={{ position: "relative" }}>
      <AppBar position="static" elevation={0} color="transparent">
        <StyledToolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <BrainIcon sx={{ fontSize: 32, mr: 1, color: "primary.main" }} />
            <Typography
              variant="h4"
              component="h1"
              color="primary"
              sx={{ flexGrow: 1 }}
            >
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
            {showInfoPanel ? "Hide Info" : "Show Info"}
          </HeaderButton>

          <HeaderButton
            startIcon={<SettingsIcon />}
            variant="outlined"
            size="small"
            onClick={openSettings} // Use context function
          >
            Settings
          </HeaderButton>

          <HeaderButton
            startIcon={
              isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />
            }
            variant="outlined"
            size="small"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </HeaderButton>
        </StyledToolbar>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 1,
            background:
              "linear-gradient(90deg, rgba(10,10,30,0.6) 0%, rgba(15,15,40,0.6) 100%)",
          }}
        >
          <Typography variant="body1" component="div">
            Real-time Visualization of 12 Brain Activity Patterns
            <DataStatusIndicator
              status={dataStatus}
              lastUpdated={lastUpdated}
              onRefresh={handleManualRefresh}
            />
          </Typography>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Typography variant="body1" color="secondary">
              FPS: {fps.toFixed(1)}
            </Typography>
            <Typography variant="body1">{currentTime}</Typography>
            <Typography variant="body2" color="text.secondary">
              Last Updated:{" "}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : ""}
            </Typography>
          </Box>
        </Box>
      </AppBar>

      <Container
        maxWidth={false}
        sx={{ flexGrow: 1, py: 1, position: "relative" }}
      >
        <Grid container spacing={1.5} sx={{ height: "100%" }}>
          {/* Display brain pairs in the grid (2 brains per cell) */}
          {brains.map((brain, i) => (
  <Grid item md={3} key={brain?.id ?? i} sx={{ height: "33%" }}>
    <BrainCell
      elevation={4}
      onClick={() => {
        // Open the detail view with an "array" containing only this brain
        setSelectedBrainPair([brain, null]); // Pass [brain, null] to reuse your time-sliced logic
        setShowBrainPairDetail(true);
      }}
      sx={{
        cursor: "pointer",
        border: selectedBrainPair?.[0]?.id === (brain?.id ?? i)
          ? `2px solid ${settings.colorTheme === "default" ? "#00b4ff" : "#00ff64"}`
          : "none",
        transition: "transform 0.2s ease-in-out",
        position: "relative",
        height: "100%",
        "&:hover": {
          transform: "scale(1.02) translateY(-2px)",
        },
      }}
    >
      {/* One brain per cell, with same sizing */}
      <MemoizedBrainVis
        brainId={brain?.id || 0}
        brainData={{
          isActive: true,
          channels: brain.channels || [],
          serialNumber: brain.serialNumber || "",
          model: brain.model || "",
          captureCount: brain.captureCount || 0,
        }}
        pulseTime={brain.pulseTime}
        showNoActivity={false}
        colorScale={COLOR_SCALES[settings.colorTheme || "default"]}
      />

      {/* Frequency Band Label */}
      <Box
        sx={{
          position: "absolute",
          bottom: 4,
          left: 4,
          color: "white",
          backgroundColor: "rgba(0,0,0,0.7)",
          px: 1.2,
          py: 0.4,
          borderRadius: 1,
          fontSize: "0.85rem",
        }}
      >
        {FREQUENCY_BANDS[i] ?? "N/A"}
      </Box>

      {/* Active indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: brain.isActive ? "#4caf50" : "#f44336",
        }}
      />
    </BrainCell>
  </Grid>
))}
        </Grid>

        {/* Enhanced Color scale legend with more color stops */}
        <ColorScaleLegend>
          {/* Create small color blocks to show the gradient */}
          <Box sx={{ 
            position: 'absolute', 
            left: 5, 
            top: 5, 
            bottom: 5, 
            width: 20,
            borderRadius: '4px',
            background: `linear-gradient(to bottom, 
              ${COLOR_SCALES[settings.colorTheme || 'default'].peak},
              ${COLOR_SCALES[settings.colorTheme || 'default'].extreme},
              ${COLOR_SCALES[settings.colorTheme || 'default'].veryHigh},
              ${COLOR_SCALES[settings.colorTheme || 'default'].high},
              ${COLOR_SCALES[settings.colorTheme || 'default'].mediumHigh},
              ${COLOR_SCALES[settings.colorTheme || 'default'].medium},
              ${COLOR_SCALES[settings.colorTheme || 'default'].lowMedium},
              ${COLOR_SCALES[settings.colorTheme || 'default'].low},
              ${COLOR_SCALES[settings.colorTheme || 'default'].veryLow},
              ${COLOR_SCALES[settings.colorTheme || 'default'].noActivity}
            )`
          }}/>
          <Box
            sx={{
              position: "absolute",
              left: 32,
              top: 0,
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            High
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              position: "absolute",
              left: 32,
              bottom: 0,
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Low
          </Box>
        </ColorScaleLegend>
        <Box
          sx={{
            position: "absolute",
            right: 10,
            top: 250,
            color: "#fff",
            fontSize: 12,
            textAlign: "center",
            width: 60,
          }}
        >
          <div>Activity</div>
          <div>Level</div>
        </Box>

        {/* Enhanced Info Panel - Using our new component */}
        <EnhancedInfoPanel
          showInfoPanel={showInfoPanel}
          selectedBrain={selectedBrain}
          brains={brains}
          dataStatus={dataStatus}
          settings={settings}
          lastUpdated={lastUpdated}
          toggleInfoPanel={toggleInfoPanel}
          handleManualRefresh={handleManualRefresh}
          handleOpenSettings={openSettings}
        />
        
        {/* Brain Pair Detail View - Now with "Open in New Tab" button */}
        <MemoizedBrainPairDetailView
          open={showBrainPairDetail}
          onClose={handleCloseBrainPairDetail}
          brainPair={selectedBrainPair}
          allBrainData={allBrainData}
          onRefresh={handleManualRefresh}
          settings={settings}
          colorScale={COLOR_SCALES[settings.colorTheme || 'default']} // Pass color scale to detail view
          onOpenInNewTab={() => {
            if (selectedBrainPair) {
              const pairIndex = brainPairs.findIndex(p => p === selectedBrainPair);
              if (pairIndex !== -1) {
                openBrainPairInNewTab(pairIndex);
              }
            }
          }}
        />
      </Container>

      <FooterBar>
        <Typography variant="caption">
          © {new Date().getFullYear()} Neural Activity Visualization • Advanced
          Monitoring System
        </Typography>
      </FooterBar>

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
    </AppContainer>
  );
};

// Export memoized component to prevent re-renders from parent
export default memo(MultiBrainDashboard);