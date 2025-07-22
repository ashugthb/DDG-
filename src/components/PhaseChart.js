import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const colors = [
  '#00ff64',
  '#00b4ff',
  '#ff4081',
  '#ff9800',
  '#aa00ff',
  '#ffea00',
  '#00e5ff',
  '#7c4dff',
  '#c6ff00',
  '#ff1744'
];

const REFRESH_MS = 2000; // poll interval in milliseconds

const PhaseChart = () => {
  const [data, setData] = useState([]);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/phaseData');
        if (!res.ok) throw new Error('Failed to load phase data');
        const devices = await res.json();
        const lineDefs = devices.map((dev, idx) => ({
          key: `D${dev.id}`,
          color: colors[idx % colors.length]
        }));

        const maxChannels = Math.max(
          ...devices.map(d => d.channels.length)
        );
        const rows = [];
        for (let i = 0; i < maxChannels; i++) {
          const row = { channel: devices[0].channels[i]?.name || `Ch${i}` };
          devices.forEach(dev => {
            if (dev.channels[i]) {
              row[`D${dev.id}`] = dev.channels[i].meanPhase;
            }
          });
          rows.push(row);
        }

        setLines(lineDefs);
        setData(rows);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <Paper sx={{ p: 2, backgroundColor: '#10102a' }}>
      <Typography variant="h6" sx={{ color: '#00b4ff', mb: 1 }}>
        Channel Phases
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="channel" stroke="#ccc" interval={0} angle={-45} textAnchor="end" height={80} />
          <YAxis domain={[-Math.PI, Math.PI]} stroke="#ccc" tickFormatter={v => v.toFixed(2)} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          {lines.map(l => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PhaseChart;
