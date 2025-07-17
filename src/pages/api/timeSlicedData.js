import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Path to your time-sliced data file
    const dataFilePath = path.join(process.cwd(), 'data', 'time_sliced_data.txt');
    const dataContent = fs.readFileSync(dataFilePath, 'utf8');

    // Parse the time-sliced data
    const parsedData = parseTimeSlicedData(dataContent);
    
    // Get the brain pair from request or calculate it
    const brainPair = getBrainPair(parsedData);

    res.status(200).json({ 
      allBrainData: parsedData,
      brainPair
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load brain data' });
  }
}

function parseTimeSlicedData(content) {
  const lines = content.trim().split('\n');
  const brains = [];
  
  let currentDevice = null;
  let currentBrain = null;

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    
    const parts = line.split(',');
    if (parts.length < 12) continue;

    const deviceId = parseInt(parts[0]);
    const channelId = parseInt(parts[1]);
    
    // Create new brain if device changes
    if (deviceId !== currentDevice) {
      if (currentBrain) {
        brains.push(currentBrain);
      }
      
      currentDevice = deviceId;
      currentBrain = {
        id: deviceId,
        scanInterval: 100, // Fixed interval as per your data
        channels: [],
        timeSlices: [[], [], [], [], []] // 5 empty slices
      };
    }

    // Create channel data
    const channel = {
      channel: channelId,
      name: `Ch${channelId}`,
      currentState: 0,
      transitions: 0,
      totalTransitions: 0,
      activity: 0
    };

    // Add time-sliced data
    for (let sliceIndex = 0; sliceIndex < 5; sliceIndex++) {
      const activity = parseFloat(parts[2 + sliceIndex]);
      const phase = parseFloat(parts[7 + sliceIndex]);
      
      currentBrain.timeSlices[sliceIndex].push({
        ...channel,
        activity,
        phase,
        changed: activity > 0,
        activityLevel: activity * 100, // Convert to percentage
        sliceIndex
      });
    }
    
    currentBrain.channels.push(channel);
  }

  // Add the last brain
  if (currentBrain) {
    brains.push(currentBrain);
  }

  return brains;
}

function getBrainPair(brains) {
  // Your logic to select a brain pair
  // For example: return [brains[0], brains[1]]
  return brains.length >= 2 ? [brains[0], brains[1]] : [brains[0], null];
}