// pages/api/load-config.js
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { configPath } = req.body;
    
    // Ensure we have a valid path
    if (!configPath) {
      return res.status(400).json({ message: 'Config path is required' });
    }
    
    // Normalize the path to prevent directory traversal attacks
    const publicDir = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicDir, configPath.replace(/^\//, ''));
    
    try {
      // Check if file exists
      await fsPromises.access(fullPath);
      
      // Read the configuration file
      const fileContents = await fsPromises.readFile(fullPath, 'utf8');
      const config = JSON.parse(fileContents);
      
      return res.status(200).json({ config });
    } catch (error) {
      // File doesn't exist or can't be parsed
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'Configuration file not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    return res.status(500).json({ message: 'Error loading configuration', error: error.message });
  }
}