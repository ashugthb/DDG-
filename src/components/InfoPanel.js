// InfoPanel.js - Component for displaying detailed information about selected brains

import React from 'react';
import {
  Box, 
  Typography, 
  Button
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { 
  InfoPanel as StyledInfoPanel, 
  DetailCard, 
  ActivityIndicator, 
  ControlButton 
} from '../styles/styledComponents';

const InfoPanel = ({ 
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
  return (
    <StyledInfoPanel className={showInfoPanel ? 'visible' : ''}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {selectedBrain ? `Brain ${selectedBrain.id + 1} Details` : 'System Information'}
        </Typography>
        <Button 
          size="small" 
          variant="outlined" 
          color="primary"
          onClick={toggleInfoPanel}
        >
          Close
        </Button>
      </Box>
      
      {selectedBrain ? (
        // Selected brain details view
        <>
          <DetailCard>
            <Typography variant="subtitle1" gutterBottom>Brain Information</Typography>
            <Typography variant="body2">
              Serial Number: {selectedBrain.serialNumber || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              Model: {selectedBrain.model || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              Status: {selectedBrain.isActive ? 
                <span style={{ color: '#4caf50' }}>Active</span> : 
                <span style={{ color: '#f44336' }}>Inactive</span>}
            </Typography>
            <Typography variant="body2">
              Capture Count: {selectedBrain.captureCount || 0}
            </Typography>
          </DetailCard>
          
          <DetailCard>
            <Typography variant="subtitle1" gutterBottom>Activity Summary</Typography>
            <Typography variant="body2">
              Active Electrodes: {selectedBrain.channels.filter(ch => ch.totalTransitions > 0).length} / {selectedBrain.channels.length || 0}
            </Typography>
            <Typography variant="body2">
              Max Activity: {selectedBrain.channels.length > 0 ? 
                Math.max(...selectedBrain.channels.map(ch => ch.totalTransitions), 0) : 0}
            </Typography>
            <Typography variant="body2">
              Recent Changes: {selectedBrain.channels.filter(ch => ch.changed).length}
            </Typography>
          </DetailCard>
          
          <DetailCard>
            <Typography variant="subtitle1" gutterBottom>Electrode Status</Typography>
            {selectedBrain.channels.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', pl: 1 }}>
                {selectedBrain.channels.map((channel) => (
                  <Box key={channel.channel} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <ActivityIndicator $active={channel.totalTransitions > 0} />
                    <Typography variant="body2" sx={{ fontWeight: channel.changed ? 'bold' : 'normal' }}>
                      {channel.name}: {channel.totalTransitions} transitions
                      {channel.changed && <span style={{ color: '#ff80ff', marginLeft: 4 }}>• ACTIVE</span>}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No electrode data available for this brain
              </Typography>
            )}
          </DetailCard>
        </>
      ) : (
        // System overview
        <>
          <DetailCard>
            <Typography variant="subtitle1" gutterBottom>System Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {dataStatus === 'success' ? (
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
              ) : (
                <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="body2">
                Data Status: {dataStatus === 'loading' ? 'Loading...' : 
                            dataStatus === 'success' ? 'Data loaded successfully' : 
                            'Error loading data'}
              </Typography>
            </Box>
            <Typography variant="body2">
              Data File: {settings.dataFilePath}
            </Typography>
            <Typography variant="body2">
              Update Interval: {settings.updateInterval / 1000} seconds
            </Typography>
            <Typography variant="body2">
              Last Data Update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </Typography>
            <Typography variant="body2">
              Active Brains: {brains.filter(b => b.isActive).length} / {brains.length}
            </Typography>
          </DetailCard>
          
          <DetailCard>
            <Typography variant="subtitle1" gutterBottom>Controls</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <ControlButton 
                size="small" 
                variant="contained"
                onClick={handleManualRefresh}
                startIcon={<RefreshIcon />}
              >
                Refresh Data
              </ControlButton>
              <ControlButton 
                size="small" 
                variant="contained"
                onClick={handleOpenSettings}
                startIcon={<SettingsIcon />}
              >
                Settings
              </ControlButton>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Click on any brain visualization for detailed analysis
              </Typography>
            </Box>
          </DetailCard>
        </>
      )}
    </StyledInfoPanel>
  );
};

export default InfoPanel;