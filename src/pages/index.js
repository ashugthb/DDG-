'use client';
import React, { useState, useCallback, createContext, useMemo } from 'react';
import Head from 'next/head';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from '../styles/styledComponents';
import MultiBrainDashboard from '../components/MultiBrainDashboard';
import SettingsDialog from '../components/SettingsDialog';
import { useRouter } from 'next/navigation';

export const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  dataFilePath: '/data/logic_data.txt',
  updateInterval: 1500,
  showInactiveOverlay: true,
  deviceSettings: Array.from({ length: 12 }, (_, i) => ({
    enabled: true,
    name: `LA${i+1}`,
    sampleRate: 8,
    sampleDepth: 200000,
    scanInterval: 100,
  })),
};

export default function Home() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const handleOpenTimeCrystal = useCallback(() => {
    router.push('/time-crystal');
  }, [router]);

  const handleSettingsChange = useCallback(newSettings => setSettings(newSettings), []);

  const settingsContextValue = useMemo(() => ({
    settings,
    updateSettings: handleSettingsChange,
    openSettings: () => setSettingsOpen(true),
  }), [settings, handleSettingsChange]);

  return (
    <>
      <Head>
        <title>Multi-Brain Neural Activity Monitor</title>
        <meta name="description" content="Advanced real-time visualization of neural activity across multiple brains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <SettingsContext.Provider value={settingsContextValue}>
          <MultiBrainDashboard />

          <button
            onClick={handleOpenTimeCrystal}
            style={{
              position: 'fixed', bottom: 20, right: 20,
              padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}
          >
            Open Time Crystal Viewer
          </button>

          <SettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </SettingsContext.Provider>
      </ThemeProvider>
    </>
  );
}



