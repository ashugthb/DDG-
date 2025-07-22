'use client';
import React from 'react';
import Head from 'next/head';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import { darkTheme } from '../styles/styledComponents';
import PhaseChart from '../components/PhaseChart';

const PhasePlotPage = () => (
  <>
    <Head>
      <title>Real-Time Phase Analysis</title>
      <meta name="description" content="Visualisation of channel phase updates" />
    </Head>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container sx={{ py: 4 }}>
        <PhaseChart />
      </Container>
    </ThemeProvider>
  </>
);

export default PhasePlotPage;
