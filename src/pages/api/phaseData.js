// pages/api/phaseData.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'phase_data.txt');
    const rawData = fs.readFileSync(filePath, 'utf8');
    
    const phaseData = rawData
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [deviceId, ...phases] = line.split(',');
        return {
          deviceId: parseInt(deviceId),
          phases: phases.map(Number)
        };
      });

    res.status(200).json(phaseData);
  } catch (error) {
    console.error('Error loading phase data:', error);
    res.status(500).json({ error: 'Failed to load phase data' });
  }
}