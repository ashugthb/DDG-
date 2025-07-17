// pages/api/brain-data.js - Simple robust solution
import fs from 'fs';
import path from 'path';

// Cache for the most recent successful read
let lastSuccessfulData = null;
let lastReadTime = null;

export default async function handler(req, res) {
  try {
    // Get file path for logic_data.txt
    const filePath = path.join(process.cwd(), 'public', 'data', 'logic_data.txt');
    
    // Function to read and parse file with retries
    const readWithRetries = async (maxRetries = 3, delayMs = 100) => {
      let retryCount = 0;
      
      while (retryCount <= maxRetries) {
        try {
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
          }
          
          // Get file stats to check size
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            throw new Error('File is empty');
          }
          
          // Try to read the file
          const fileContent = fs.readFileSync(filePath, 'utf8');
          if (!fileContent || fileContent.trim() === '') {
            throw new Error('File contains only whitespace');
          }
          
          // Parse the data
          return parseLogicData(fileContent);
        } catch (error) {
          // If this is our last retry, throw the error
          if (retryCount === maxRetries) {
            throw error;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
          retryCount++;
          
          // Double the delay for each retry (exponential backoff)
          delayMs *= 2;
        }
      }
    };
    
    // Try to read and parse the file
    try {
      const brainData = await readWithRetries();
      
      // Update the cache
      lastSuccessfulData = brainData;
      lastReadTime = new Date();
      
      // Return the data
      return res.status(200).json({
        timestamp: lastReadTime.toISOString(),
        brainData: brainData,
        source: 'file'
      });
    } catch (error) {
      console.warn(`Error reading/parsing file: ${error.message}. Using cached data if available.`);
      
      // If we have cached data, return it instead
      if (lastSuccessfulData) {
        return res.status(200).json({
          timestamp: lastReadTime.toISOString(),
          brainData: lastSuccessfulData,
          source: 'cache',
          note: `Using cached data due to error: ${error.message}`
        });
      }
      
      // No cached data available, return the error
      return res.status(500).json({
        error: `Could not read data file: ${error.message}`
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Function to parse the logic data file
function parseLogicData(fileContent) {
  try {
    const lines = fileContent.trim().split('\n');
    
    // Parse data from the file
    const brainData = [];
    let currentBrainId = -1;
    let currentBrain = null;
    
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') {
        // Skip comments and empty lines
        continue;
      }
      
      const parts = line.trim().split(',');
      
      if (parts[0] === 'DEVICE') {
        // Start of a new device/brain
        if (currentBrain !== null) {
          brainData.push(currentBrain);
        }
        
        // Handle potential parsing errors
        try {
          currentBrainId = parseInt(parts[1]);
          if (isNaN(currentBrainId)) currentBrainId = 0;
          
          currentBrain = {
            id: currentBrainId,
            serialNumber: parts[2] || `Unknown`,
            model: parts[3] || 'Unknown',
            captureCount: parseInt(parts[4]) || 0,
            channels: [],
            isActive: false  // Will be set to true if any channels are active
          };
        } catch (parseError) {
          console.warn('Error parsing DEVICE line:', parseError);
          // Create a minimal valid device if parsing fails
          currentBrainId = currentBrainId + 1;
          currentBrain = {
            id: currentBrainId,
            serialNumber: 'Error',
            model: 'Error',
            captureCount: 0,
            channels: [],
            isActive: false
          };
        }
      } else if (parts[0] === 'CHANNEL' && currentBrain !== null) {
        // Channel data for current brain
        try {
          const channelId = parseInt(parts[1]);
          if (isNaN(channelId)) continue; // Skip invalid channel lines
          
          const channelName = parts[2] || `Channel ${channelId}`;
          const currentState = parseInt(parts[3]) || 0;
          const transitions = parseInt(parts[4]) || 0;
          const totalTransitions = parseInt(parts[5]) || 0;
          const activityLevel = parseInt(parts[6] || '0'); // Default to 0
          
          // Store channel data
          currentBrain.channels.push({
            channel: channelId,
            name: channelName,
            currentState: currentState,
            transitions: transitions,
            totalTransitions: totalTransitions,
            activityLevel: activityLevel,
            changed: activityLevel > 0  // Mark as changed if activity level > 0
          });
          
          // If any channel has activity, mark the brain as active
          if (transitions > 0 || totalTransitions > 0) {
            currentBrain.isActive = true;
          }
        } catch (parseError) {
          // Silently skip problematic channel lines
          console.warn('Error parsing CHANNEL line:', parseError);
        }
      }
    }
    
    // Add the last brain if it exists
    if (currentBrain !== null) {
      brainData.push(currentBrain);
    }
    
    // Return parsed brain data
    return brainData;
  } catch (error) {
    console.error('Error parsing logic data:', error);
    throw new Error(`Failed to parse logic data: ${error.message}`);
  }
}