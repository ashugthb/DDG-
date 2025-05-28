'use client';
import Head from 'next/head';
import { useState, useCallback, createContext, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from '../styles/styledComponents';
import MultiBrainDashboard from '../components/MultiBrainDashboard';
import SettingsDialog from '../components/SettingsDialog';

// Create a context for settings
export const SettingsContext = createContext(null);

// Default settings
const DEFAULT_SETTINGS = {
  dataFilePath: '/data/logic_data.txt',
  updateInterval: 1500, // 1.5 seconds
  showInactiveOverlay: true,
  deviceSettings: Array.from({ length: 12 }, (_, index) => ({
    enabled: true,
    name: `LA${index + 1}`,
    sampleRate: 8, // 100MHz
    sampleDepth: 200000,
    scanInterval: 100,
  }))
};

export default function Home() {
  // State for settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // Handle settings dialog
  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);
  
  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);
  
  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);
  
  // Memoize the context value to prevent unnecessary renders
  const settingsContextValue = useMemo(() => ({
    settings,
    updateSettings: handleSettingsChange,
    openSettings: handleOpenSettings
  }), [settings, handleSettingsChange, handleOpenSettings]);
  
  return (
    <>
      <Head>
        <title>Multi-Brain Neural Activity Monitor</title>
        <meta name="description" content="Advanced real-time visualization of neural activity across multiple brains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <SettingsContext.Provider value={settingsContextValue}>
          {/* Dashboard doesn't need to know about settings dialog state */}
          <MultiBrainDashboard />
          
          {/* Settings dialog is managed here, separate from dashboard updates */}
          <SettingsDialog 
            open={settingsOpen}
            onClose={handleCloseSettings}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </SettingsContext.Provider>
      </ThemeProvider>
    </>
  );
}