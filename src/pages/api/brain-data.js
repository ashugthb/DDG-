// pages/api/brain-data.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Path to the data file
    const dataFilePath = path.join(process.cwd(), 'public/data/brain_data.json');
    
    // Check if file exists
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: 'Data file not found' });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    
    // Parse JSON
    const data = JSON.parse(fileContent);
    
    // Add server timestamp
    data.serverTimestamp = new Date().toISOString();
    
    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error reading brain data:', error);
    return res.status(500).json({ error: 'Failed to read brain data' });
  }
}