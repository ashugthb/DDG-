// pages/api/phaseData.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'phase_data.txt');
    const raw = fs.readFileSync(filePath, 'utf8');

    const devices = [];
    let current = null;
    raw.split(/\r?\n/).forEach(line => {
      if (!line.trim() || line.startsWith('#')) return;
      const parts = line.split(',');
      if (parts[0] === 'DEVICE') {
        if (current) devices.push(current);
        current = {
          id: parseInt(parts[1]),
          serial: parts[2].trim(),
          model: parts[3].trim(),
          captureCount: parseInt(parts[4]) || 0,
          channels: []
        };
      } else if (parts[0] === 'PHASE' && current) {
        const meanPhase = parseFloat(parts[3]);
        current.channels.push({
          channel: parseInt(parts[1]),
          name: parts[2].trim(),
          meanPhase,
          meanPhaseDeg: meanPhase * 180 / Math.PI,
          variance: parseFloat(parts[4])
        });
      }
    });
    if (current) devices.push(current);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error loading phase data:', error);
    res.status(500).json({ error: 'Failed to load phase data' });
  }
}
