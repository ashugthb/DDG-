// SettingsDialog.js - With direct file saving to server and loading from server

import React, { useState, useEffect, memo } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  InputLabel,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import TimerIcon from '@mui/icons-material/Timer';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import DevicesIcon from '@mui/icons-material/Devices';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RefreshIcon from '@mui/icons-material/Refresh';

// Sample rate options
const SAMPLE_RATE_OPTIONS = [
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

// Sample depth options based on C++ file constraints (1000 to 32000000)
const SAMPLE_DEPTH_OPTIONS = [
  { value: 1000, label: '1,000 samples' },
  { value: 2000, label: '2,000 samples' },
  { value: 5000, label: '5,000 samples' },
  { value: 10000, label: '10,000 samples' },
  { value: 20000, label: '20,000 samples' },
  { value: 50000, label: '50,000 samples' },
  { value: 100000, label: '100,000 samples' },
  { value: 200000, label: '200,000 samples' },
  { value: 500000, label: '500,000 samples' },
  { value: 1000000, label: '1,000,000 samples' },
  { value: 2000000, label: '2,000,000 samples' },
  { value: 5000000, label: '5,000,000 samples' },
  { value: 10000000, label: '10,000,000 samples' },
  { value: 20000000, label: '20,000,000 samples' },
  { value: 32000000, label: '32,000,000 samples' }
];

// Scan interval options based on C++ file constraints (10 to 5000ms)
const SCAN_INTERVAL_OPTIONS = [
  { value: 10, label: '10 ms' },
  { value: 20, label: '20 ms' },
  { value: 50, label: '50 ms' },
  { value: 100, label: '100 ms' },
  { value: 200, label: '200 ms' },
  { value: 500, label: '500 ms' },
  { value: 1000, label: '1 second' },
  { value: 2000, label: '2 seconds' },
  { value: 3000, label: '3 seconds' },
  { value: 5000, label: '5 seconds' }
];

// Default device settings for a single device
const DEFAULT_DEVICE_SETTINGS = {
  enabled: true,
  name: "LA", // Will be appended with number
  sampleRateCode: 8, // 100MHz
  sampleDepth: 200000,
  scanIntervalMs: 100,
  voltageThreshold: 0.98,
};

// Generate default settings for all devices
// Update in SettingsDialog.js - Fix the field names to match C++ expectations
const generateDefaultSettings = () => ({
  dataFilePath: 'C:\\Ashvajeet\\FULL_Setup\\brain-viz\\public\\data\\logic_data.txt',
  updateIntervalMs: 1500, // Changed from updateInterval to updateIntervalMs
  showInactiveOverlay: true,
  useGroupedConnection: true,
  groupSwitchDelayMs: 500,
  groupSize: 6,
  
  // Add default device settings with correct C++ field names
  defaultSampleRate: 8,
  defaultSampleDepth: 200000,
  defaultScanInterval: 100,
  defaultVoltageThreshold: 0.98,
  defaultEnableTrigger: false,
  defaultTriggerChannel: 0,
  defaultTriggerRisingEdge: true,
  
  // Device settings
  deviceSettings: Array.from({ length: 12 }, (_, index) => ({
    enabled: true,
    name: `LA${index + 1}`,
    sampleRateCode: 8, // Changed from sampleRate to sampleRateCode
    sampleDepth: 200000,
    scanIntervalMs: 100, // Changed from scanInterval to scanIntervalMs
    voltageThreshold: 0.98 // Added to match C++ expectations
  }))
});

// Device status chip component
const DeviceStatusChip = memo(({ status, lastScanTime }) => {
  let chipProps = {
    label: 'Unknown',
    color: 'default',
    size: 'small',
    icon: <ErrorOutlineIcon />
  };
  
  if (status === 'success') {
    chipProps = {
      label: 'OK',
      color: 'success',
      size: 'small',
      icon: <CheckCircleOutlineIcon />
    };
  }
  
  return (
    <Chip {...chipProps} sx={{ ml: 1 }} />
  );
});

// Device setting card
const DeviceSettingCard = memo(({ device, index, onChange }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2, 
        background: 'rgba(20,20,50,0.4)',
        border: device.enabled ? '1px solid rgba(80,130,255,0.3)' : '1px solid rgba(150,150,150,0.1)',
        borderRadius: 2,
        transition: 'all 0.2s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DevicesIcon sx={{ mr: 1, color: device.enabled ? 'primary.main' : 'text.disabled' }} />
          <Typography variant="h6" color={device.enabled ? 'text.primary' : 'text.disabled'}>
            {device.name || `LA${index + 1}`}
          </Typography>
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={device.enabled}
                onChange={(e) => onChange(index, 'enabled', e.target.checked)}
                color="primary"
              />
            }
            label={device.enabled ? "Enabled" : "Disabled"}
          />
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Device Name"
            value={device.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            disabled={!device.enabled}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Device name">
                    <DeviceHubIcon fontSize="small" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth disabled={!device.enabled} size="small">
            <InputLabel>Sample Rate</InputLabel>
            <Select
              value={device.sampleRateCode !== undefined ? device.sampleRateCode : 8}
              onChange={(e) => onChange(index, 'sampleRateCode', e.target.value)}
              label="Sample Rate"
              startAdornment={
                <InputAdornment position="start">
                  <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                </InputAdornment>
              }
            >
              {SAMPLE_RATE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth disabled={!device.enabled} size="small">
            <InputLabel>Sample Depth</InputLabel>
            <Select
              value={device.sampleDepth !== undefined ? device.sampleDepth : 200000}
              onChange={(e) => onChange(index, 'sampleDepth', e.target.value)}
              label="Sample Depth"
              startAdornment={
                <InputAdornment position="start">
                  <StorageIcon fontSize="small" sx={{ mr: 1 }} />
                </InputAdornment>
              }
            >
              {SAMPLE_DEPTH_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth disabled={!device.enabled} size="small">
            <InputLabel>Scan Interval</InputLabel>
            <Select
              value={device.scanIntervalMs !== undefined ? device.scanIntervalMs : 100}
              onChange={(e) => onChange(index, 'scanIntervalMs', e.target.value)}
              label="Scan Interval"
              startAdornment={
                <InputAdornment position="start">
                  <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                </InputAdornment>
              }
            >
              {SCAN_INTERVAL_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Voltage Threshold"
            value={device.voltageThreshold || 0.98}
            onChange={(e) => onChange(index, 'voltageThreshold', parseFloat(e.target.value))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Voltage threshold">
                    <TuneIcon fontSize="small" />
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">V</InputAdornment>,
            }}
            disabled={!device.enabled}
            size="small"
            inputProps={{ step: 0.1, min: 0.5, max: 5.0 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
});

// Advanced settings dialog with improved UI
const SettingsDialog = ({ open, onClose, settings, onSettingsChange }) => {
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [configFile, setConfigFile] = useState(null);
  
  // Function to load configuration from server
  const loadConfigFromServer = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      // Use fetch to load the file via an API endpoint
      const response = await fetch('/api/load-config');
      
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.config) {
        throw new Error('Invalid configuration data received');
      }
      
      // Process the loaded configuration
      const loadedConfig = data.config;
      setConfigFile(loadedConfig);
      
      // Ensure all devices have required properties
      loadedConfig.deviceSettings = loadedConfig.deviceSettings?.map((device, index) => {
        // Create device with defaults for any missing properties
        const defaultDevice = {
          ...DEFAULT_DEVICE_SETTINGS,
          name: `LA${index + 1}`,
        };
        
        return { ...defaultDevice, ...device };
      }) || [];
      
      // Make sure we have exactly 12 devices
      while (loadedConfig.deviceSettings.length < 12) {
        const index = loadedConfig.deviceSettings.length;
        loadedConfig.deviceSettings.push({
          ...DEFAULT_DEVICE_SETTINGS,
          name: `LA${index + 1}`,
        });
      }
      
      // Keep only the first 12 devices if there are more
      if (loadedConfig.deviceSettings.length > 12) {
        loadedConfig.deviceSettings = loadedConfig.deviceSettings.slice(0, 12);
      }
      
      // Update temp settings with loaded configuration
      setTempSettings(loadedConfig);
      
      console.log('Loaded configuration:', loadedConfig);
      return loadedConfig;
    } catch (error) {
      console.error('Error loading configuration:', error);
      setLoadError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize settings on open
  useEffect(() => {
    if (open) {
      // Load configuration from server
      loadConfigFromServer().then(loadedConfig => {
        if (!loadedConfig) {
          // If loading failed, use the passed-in settings or defaults
          let settingsCopy;
          try {
            settingsCopy = JSON.parse(JSON.stringify(settings));
          } catch (err) {
            console.error('Error parsing settings, using defaults:', err);
            settingsCopy = generateDefaultSettings();
          }
          
          // Ensure all devices have required properties
          settingsCopy.deviceSettings = settingsCopy.deviceSettings.map((device, index) => {
            // Create device with defaults for any missing properties
            const defaultDevice = {
              ...DEFAULT_DEVICE_SETTINGS,
              name: `LA${index + 1}`,
            };
            
            return { ...defaultDevice, ...device };
          });
          
          // Make sure we have exactly 12 devices
          while (settingsCopy.deviceSettings.length < 12) {
            const index = settingsCopy.deviceSettings.length;
            settingsCopy.deviceSettings.push({
              ...DEFAULT_DEVICE_SETTINGS,
              name: `LA${index + 1}`,
            });
          }
          
          // Keep only the first 12 devices if there are more
          if (settingsCopy.deviceSettings.length > 12) {
            settingsCopy.deviceSettings = settingsCopy.deviceSettings.slice(0, 12);
          }
          
          setTempSettings(settingsCopy);
        }
        
        setSaveError(null);
        setSaveSuccess(false);
      });
    }
  }, [settings, open]);
  
  // Handle changes to device settings
  const handleDeviceSettingChange = (deviceIndex, field, value) => {
    setTempSettings(prev => {
      const updatedDeviceSettings = [...prev.deviceSettings];
      updatedDeviceSettings[deviceIndex] = {
        ...updatedDeviceSettings[deviceIndex],
        [field]: value
      };
      return {
        ...prev,
        deviceSettings: updatedDeviceSettings
      };
    });
  };
  
  // Save configuration directly to file on server
  const saveSettingsToFile = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      
      // Format the configuration file content
      const configContent = JSON.stringify(tempSettings, null, 2);
      
      // Use fetch to save the file via an API endpoint
      const response = await fetch('/api/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: 'C:/Ashvajeet/FULL_Setup/brain-viz/public/data/analyzer_config.json',
          content: configContent
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.statusText}`);
      }
      
      // Successfully saved
      setSaveSuccess(true);
      
      // Notify parent about the changes
      onSettingsChange(tempSettings);
      
      // Close after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle save button click
  const handleSave = () => {
    saveSettingsToFile();
  };

  // Tab components
  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`settings-tabpanel-${index}`}
        aria-labelledby={`settings-tab-${index}`}
        {...other}
        style={{ height: '100%', overflowY: 'auto' }}
      >
        {value === index && (
          <Box sx={{ height: '100%' }}>
            {children}
          </Box>
        )}
      </div>
    );
  };
  
  // Show loading state while fetching configuration
  if (loading && open) {
    return (
      <Dialog 
        open={open} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Loading Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading device configuration...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Important for fixed save button
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(90deg, rgba(16,16,42,1) 0%, rgba(23,23,64,1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6">Logic Analyzer Configuration</Typography>
          {configFile && (
            <Chip 
              label="Config Loaded" 
              color="success" 
              size="small" 
              icon={<CloudDownloadIcon />} 
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Box>
          <IconButton 
            color="primary" 
            onClick={loadConfigFromServer} 
            disabled={loading} 
            sx={{ mr: 1 }}
            title="Reload configuration"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      {loadError && (
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading configuration: {loadError}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', overflow: 'hidden' }}>
        {/* Tabs sidebar */}
        <Box sx={{ 
          width: 200, 
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(10,10,30,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ 
              borderRight: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                py: 1,
                px: 2,
                justifyContent: 'flex-start',
                alignItems: 'center'
              }
            }}
          >
            <Tab 
              icon={<DevicesIcon />} 
              iconPosition="start" 
              label="LA1-LA6" 
              sx={{ textAlign: 'left' }}
            />
            <Tab 
              icon={<DevicesIcon />} 
              iconPosition="start" 
              label="LA7-LA12" 
              sx={{ textAlign: 'left' }}
            />
            <Tab 
              icon={<TuneIcon />} 
              iconPosition="start" 
              label="Data Settings" 
              sx={{ textAlign: 'left' }}
            />
            <Tab 
              icon={<InfoIcon />} 
              iconPosition="start" 
              label="Information" 
              sx={{ textAlign: 'left' }}
            />
          </Tabs>
          
          <Box sx={{ mt: 'auto', p: 2 }}>
            <Alert severity="info" icon={<HelpIcon />} sx={{ mb: 2 }}>
              Settings will be saved directly to the config file on the server.
            </Alert>
          </Box>
        </Box>
        
        {/* Main content area */}
        <DialogContent 
          sx={{ 
            p: 3, 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto' // Ensure scrolling works
          }}
        >
          {/* Devices 1-6 */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <DevicesIcon sx={{ mr: 1 }} />
              Logic Analyzers 1-6
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {/* Explicitly show all 6 devices one by one to ensure they're all visible */}
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <DeviceSettingCard 
                  key={idx}
                  device={tempSettings.deviceSettings[idx]}
                  index={idx}
                  onChange={handleDeviceSettingChange}
                />
              ))}
            </Box>
          </TabPanel>
          
          {/* Devices 7-12 */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <DevicesIcon sx={{ mr: 1 }} />
              Logic Analyzers 7-12
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {/* Explicitly show all 6 devices one by one to ensure they're all visible */}
              {[6, 7, 8, 9, 10, 11].map(idx => (
                <DeviceSettingCard 
                  key={idx}
                  device={tempSettings.deviceSettings[idx]}
                  index={idx}
                  onChange={handleDeviceSettingChange}
                />
              ))}
            </Box>
          </TabPanel>
          
          {/* Data Settings */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <TuneIcon sx={{ mr: 1 }} />
              Data Settings
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(20,20,50,0.4)' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data File Path"
                    value={tempSettings.dataFilePath}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, dataFilePath: e.target.value }))}
                    helperText="Path to the logic_data.txt file"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Update Interval"
                    value={tempSettings.updateIntervalMs}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, updateIntervalMs: parseInt(e.target.value) || 1500 }))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                    }}
                    helperText="How often to check for new data"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              These settings control how the application reads and processes data from the logic analyzers.
            </Alert>
          </TabPanel>
          
          {/* Information */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              Configuration Information
            </Typography>
            
            {configFile && (
              <Paper sx={{ p: 3, mb: 3, background: 'rgba(20,20,50,0.4)' }}>
                <Typography variant="subtitle1" gutterBottom color="primary.main">
                  Current Configuration Details
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.light', display: 'flex', alignItems: 'center' }}>
                        <DevicesIcon fontSize="small" sx={{ mr: 1 }} />
                        Device Status
                      </Typography>
                      <Typography variant="body2">
                        Total Devices: {configFile.deviceSettings.length}
                      </Typography>
                      <Typography variant="body2">
                        Enabled Devices: {configFile.deviceSettings.filter(d => d.enabled).length}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.light', display: 'flex', alignItems: 'center' }}>
                        <TuneIcon fontSize="small" sx={{ mr: 1 }} />
                        Global Settings
                      </Typography>
                      <Typography variant="body2">
                        Update Interval: {configFile.updateIntervalMs}ms
                      </Typography>
                      <Typography variant="body2">
                        Group Connection: {configFile.useGroupedConnection ? 'Enabled' : 'Disabled'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.light' }}>
                  Device Summary
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {configFile.deviceSettings.filter(d => d.enabled).slice(0, 6).map((device, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" color="primary.light">
                            {device.name}
                          </Typography>
                          <Chip 
                            label="Enabled" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <SpeedIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                          {SAMPLE_RATE_OPTIONS.find(opt => opt.value === device.sampleRateCode)?.label || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <TimerIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                          {device.scanIntervalMs}ms scan interval
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <TuneIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                          {device.voltageThreshold}V threshold
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
            
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(20,20,50,0.4)' }}>
              <Typography variant="subtitle1" gutterBottom>
                How Configuration Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                This interface allows you to configure settings for up to 12 logic analyzers (LA1-LA12). 
                Each device can have its own sample rate, sample depth, and scan interval.
              </Typography>
              
              <Typography variant="body2" paragraph>
                After configuring the settings, click the "Save Configuration" button. This will automatically
                update the <code>analyzer_config.json</code> file in the <code>public/data</code> directory
                of the application.
              </Typography>
              
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                The settings will take effect immediately after saving. No manual file transfers required!
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Sample Rate Guide
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                    <Typography variant="subtitle2" color="primary.main">Low Rates (1-10 MHz)</Typography>
                    <Typography variant="body2">
                      Best for slower signals or when you need to capture for longer durations.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                    <Typography variant="subtitle2" color="primary.main">Medium Rates (20-100 MHz)</Typography>
                    <Typography variant="body2">
                      Good balance of temporal resolution and capture duration.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                    <Typography variant="subtitle2" color="primary.main">High Rates (125-400 MHz)</Typography>
                    <Typography variant="body2">
                      For high-speed signals where timing precision is critical.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                C++ Configuration Parameters
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                    <Typography variant="subtitle2" color="primary.main">Sample Depth</Typography>
                    <Typography variant="body2">
                      Valid range: 1,000 to 32,000,000 samples
                    </Typography>
                    <Typography variant="body2">
                      Default: 200,000 samples
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, background: 'rgba(30,30,70,0.4)' }}>
                    <Typography variant="subtitle2" color="primary.main">Scan Interval</Typography>
                    <Typography variant="body2">
                      Valid range: 10ms to 5,000ms
                    </Typography>
                    <Typography variant="body2">
                      Default: 100ms
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>
        </DialogContent>
      </Box>
      
      {/* Fixed bottom bar with save button */}
      <DialogActions sx={{ 
        p: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(10,10,30,0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        position: 'sticky',
        bottom: 0,
        zIndex: 10
      }}>
        {saveSuccess && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography variant="body2">Configuration saved successfully! Changes applied immediately.</Typography>
          </Box>
        )}
        
        {saveError && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <ErrorOutlineIcon sx={{ mr: 1 }} />
            <Typography variant="body2">{saveError}</Typography>
          </Box>
        )}
        
        {!saveSuccess && !saveError && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Settings will be saved directly to the server
            </Typography>
          </Box>
        )}
        
        <Box>
          <Button onClick={onClose} disabled={saving} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(SettingsDialog);