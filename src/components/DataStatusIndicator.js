// DataStatusIndicator.js - Shows the current data loading status
import React from 'react';
import { Box, Typography, CircularProgress, Tooltip, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ActivityIndicator } from '../styles/styledComponents';

const DataStatusIndicator = ({ status, lastUpdated, onRefresh }) => {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2">Loading Data...</Typography>
          </Box>
        );
      
      case 'success':
        return (
          <Tooltip title={`Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Unknown'}`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ActivityIndicator $active={true} />
              <Typography variant="body2">Live Data</Typography>
            </Box>
          </Tooltip>
        );
      
      case 'error':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ mr: 1, fontSize: 16 }} />
            <Typography variant="body2" color="error">Data Error</Typography>
            <Button 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={onRefresh}
              sx={{ ml: 1, minWidth: 'auto', p: '2px 8px' }}
            >
              Retry
            </Button>
          </Box>
        );
      
      default:
        return (
          <Typography variant="body2">Unknown Status</Typography>
        );
    }
  };
  
  return (
    <Box component="span" sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
      {renderContent()}
    </Box>
  );
};

export default React.memo(DataStatusIndicator);