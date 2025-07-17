import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', 'data', 'time_sliced_data.txt');
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const devices = Array(12).fill().map(() => ({ slices: Array(5).fill([]) }));
    
    const lines = data.split('\n');
    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue;
      
      const parts = line.split(',');
      if (parts.length < 9) continue;

      const deviceIndex = parseInt(parts[0]);
      const channelId = parseInt(parts[1]);
      const activityLevels = parts.slice(2, 7).map(parseFloat);
      const frequency = parseFloat(parts[7]);
      const phase = parseFloat(parts[8]);
      
      // Only process devices 0-11
      if (deviceIndex < 0 || deviceIndex > 11) continue;
      
      for (let sliceIndex = 0; sliceIndex < 5; sliceIndex++) {
        devices[deviceIndex].slices[sliceIndex].push({
          id: channelId,
          activity: activityLevels[sliceIndex],
          frequency,
          phase
        });
      }
    }

    // Add device metadata
    const result = devices.map((device, index) => ({
      id: index,
      slices: device.slices,
      isActive: device.slices.some(slice => 
        slice.some(ch => ch.activity > 0)
      ),
      activeChannels: [...new Set(
        device.slices.flatMap(slice => 
          slice.filter(ch => ch.activity > 0).map(ch => ch.id)
        )
      )].length
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing time-sliced data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
}