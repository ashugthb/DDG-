// pages/time-crystal.jsx
'use client';
import React from 'react';
import Head from 'next/head';
import TimeCrystal from '../components/TimeCrystalVisualization';

export default function TimeCrystalPage() {
  return (
    <>
      <Head>
        <title>Time Crystal Visualization</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* Render the TimeCrystal component, which will open its own window and handle fetching */}
      <TimeCrystal />
    </>
  );
}


