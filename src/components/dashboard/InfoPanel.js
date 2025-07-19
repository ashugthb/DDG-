import React, { memo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  LinearProgress,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import DevicesIcon from '@mui/icons-material/Devices';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import TuneIcon from '@mui/icons-material/Tune';
import BarChartIcon from '@mui/icons-material/BarChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorIcon from '@mui/icons-material/Error';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import {
  COLOR_SCALES,
  SAMPLE_RATE_LABELS,
  getActivityColor,
} from './constants';

const InfoPanel = memo(({
  showInfoPanel,
  selectedBrain,
  brains,
  dataStatus,
  settings,
  lastUpdated,
  toggleInfoPanel,
  handleManualRefresh,
  handleOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const renderStatCard = (
    title,
    value,
    icon,
    color = 'primary.main',
    bgColor = 'rgba(25, 118, 210, 0.1)'
  ) => (
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
          opacity: 0.7,
        },
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
        alignItems: 'center',
      }}>
        {value}
      </Typography>
    </Box>
  );

  const renderDeviceConfigCard = (deviceIndex) => {
    const deviceConfig = settings.deviceSettings && settings.deviceSettings[deviceIndex];
    if (!deviceConfig) return null;
    const brain = brains[deviceIndex];
    const activeChannels = brain?.channels?.filter((ch) => ch.activity > 0)?.length || 0;
    const activityPercentage = brain?.isActive ? (activeChannels / (brain?.channels?.length || 1)) * 100 : 0;
    const statusColor = !brain?.isActive
      ? '#f44336'
      : activeChannels > 0
      ? '#4caf50'
      : '#ff9800';

    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)',
          border: deviceConfig.enabled ? `1px solid ${statusColor}` : '1px solid rgba(150,150,150,0.1)',
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
            opacity: 0.7,
          },
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
            label={deviceConfig.enabled ? (brain?.isActive ? 'Active' : 'Inactive') : 'Disabled'}
            size="small"
            color={deviceConfig.enabled ? (brain?.isActive ? 'success' : 'error') : 'default'}
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
                  background: `linear-gradient(90deg, ${COLOR_SCALES[settings.colorTheme || 'default'].low} 0%, ${COLOR_SCALES[settings.colorTheme || 'default'].peak} 100%)`,
                },
              }}
            />
          </Box>
        )}
        {brain?.serialNumber && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              borderRadius: 1,
              fontSize: '0.75rem',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              opacity: 0.7,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DeveloperBoardIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">S/N: {brain.serialNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MemoryIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">Model: {brain.model || 'Unknown'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
              <Typography variant="caption">Captures: {brain.captureCount || 0}</Typography>
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  const activeBrainsCount = brains.filter((brain) => brain.isActive).length;
  const totalChannels = brains.reduce((t, brain) => t + (brain.channels?.length || 0), 0);
  const activeChannels = brains.reduce((t, brain) => t + (brain.channels?.filter((ch) => ch.activity > 0)?.length || 0), 0);

  let systemStatus = 'Operational';
  let statusColor = '#4caf50';

  if (activeBrainsCount === 0) {
    systemStatus = 'Offline';
    statusColor = '#f44336';
  } else if (activeBrainsCount < brains.length / 2) {
    systemStatus = 'Degraded';
    statusColor = '#ff9800';
  }

  return (
    <Box
      sx={{
        position: 'fixed',
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
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(100,100,255,0.2)',
          background: 'linear-gradient(90deg, rgba(20,20,50,0.7) 0%, rgba(15,15,40,0.7) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">System Information</Typography>
        </Box>
        <IconButton onClick={toggleInfoPanel} size="small" sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(100,100,255,0.1)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: 'text.secondary', fontSize: '0.85rem', minHeight: '48px' },
            '& .Mui-selected': { color: 'primary.main' },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          <Tab icon={<DashboardIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Dashboard" sx={{ textTransform: 'none' }} />
          <Tab icon={<DevicesIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Devices" sx={{ textTransform: 'none' }} />
          <Tab icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Settings" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Box>
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        {activeTab === 0 && (
          <Box>
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
                },
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
                    animation: systemStatus === 'Operational' ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { boxShadow: `0 0 0 0 rgba(76, 175, 80, 0.7)` },
                      '70%': { boxShadow: `0 0 0 10px rgba(76, 175, 80, 0)` },
                      '100%': { boxShadow: `0 0 0 0 rgba(76, 175, 80, 0)` },
                    },
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
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium', color: 'primary.main' }}>
              System Overview
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                {renderStatCard('ACTIVE DEVICES', `${activeBrainsCount} / ${brains.length}`, <DevicesIcon />, '#2196f3', 'rgba(33, 150, 243, 0.1)')}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard('ACTIVE CHANNELS', `${activeChannels} / ${totalChannels}`, <DevicesIcon />, '#4caf50', 'rgba(76, 175, 80, 0.1)')}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard(
                  'DATA STATUS',
                  dataStatus === 'success' ? 'Online' : dataStatus === 'loading' ? 'Loading' : 'Error',
                  <MemoryIcon />,
                  dataStatus === 'success' ? '#4caf50' : dataStatus === 'loading' ? '#ff9800' : '#f44336',
                  dataStatus === 'success' ? 'rgba(76, 175, 80, 0.1)' : dataStatus === 'loading' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                )}
              </Grid>
              <Grid item xs={6}>
                {renderStatCard('SCAN INTERVAL', `${settings.updateInterval} ms`, <TimerIcon />, '#9c27b0', 'rgba(156, 39, 176, 0.1)')}
              </Grid>
            </Grid>
            <Typography variant="subtitle1" sx={{ mb: 1.5, mt: 3, fontWeight: 'medium', color: 'primary.main' }}>
              Most Active Devices
            </Typography>
            {brains
              .map((brain, index) => ({ brain, index, activity: brain.channels?.filter((ch) => ch.activity > 0)?.length || 0 }))
              .sort((a, b) => b.activity - a.activity)
              .slice(0, 3)
              .map(({ brain, index, activity }) => (
                <Box key={index} sx={{ p: 1.5, mb: 2, borderRadius: 2, background: 'linear-gradient(135deg, rgba(20,20,50,0.7) 0%, rgba(10,10,30,0.7) 100%)', border: '1px solid rgba(100,100,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label={`Brain ${index + 1}`} size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{brain.serialNumber || 'Unknown'}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={`${activity} active channels`} size="small" sx={{ bgcolor: getActivityColor(activity / 32, true, settings.colorTheme), color: 'white' }} />
                  </Box>
                </Box>
              ))}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" startIcon={<RefreshIcon />} onClick={handleManualRefresh} sx={{ flexGrow: 1 }}>
                Refresh Data
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<SettingsIcon />} onClick={handleOpenSettings} sx={{ flexGrow: 1 }}>
                Configure
              </Button>
            </Box>
          </Box>
        )}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'primary.main' }}>
              Device Configuration
            </Typography>
            {Array.from({ length: 12 }, (_, i) => i).map((deviceIndex) => renderDeviceConfigCard(deviceIndex))}
          </Box>
        )}
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
                <ListItem sx={{ py: 1.5, borderBottom: '1px solid rgba(100,100,255,0.1)' }}>
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
                <ListItem sx={{ py: 1.5, borderBottom: '1px solid rgba(100,100,255,0.1)' }}>
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
                <ListItem sx={{ py: 1.5, borderBottom: '1px solid rgba(100,100,255,0.1)' }}>
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
                <ListItem sx={{ py: 1.5, borderBottom: '1px solid rgba(100,100,255,0.1)' }}>
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
                <ListItem sx={{ py: 1.5 }}>
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
            <Button variant="contained" color="primary" startIcon={<SettingsIcon />} onClick={handleOpenSettings} fullWidth>
              Open Settings Panel
            </Button>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(100,100,255,0.2)',
          background: 'linear-gradient(90deg, rgba(20,20,50,0.7) 0%, rgba(15,15,40,0.7) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {`Last data update: ${lastUpdated ? lastUpdated.toLocaleString() : 'Never'}`}
        </Typography>
        <Chip icon={<ScienceIcon />} label="Neural Analyzer v1.0" size="small" color="primary" variant="outlined" />
      </Box>
    </Box>
  );
});

export default InfoPanel;
