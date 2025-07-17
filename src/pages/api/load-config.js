// pages/api/load-config.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the filePath from query or use default
    const filePath = req.query.path || 'C:/Ashvajeet/FULL_Setup/brain-viz/public/data/analyzer_config.json';
    
    // Only allow reading from brain-viz directory for security
    if (!filePath.includes('brain-viz')) {
      return res.status(403).json({ 
        message: 'Security Error: Can only read from brain-viz directory',
        requestedPath: filePath
      });
    }
    
    // Normalize the file path based on OS
    const normalizedPath = filePath.replace(/\//g, '\\');
    console.log('Loading configuration from:', normalizedPath);
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({
        message: 'Configuration file not found',
        path: normalizedPath
      });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(normalizedPath, { encoding: 'utf8' });
    
    // Parse JSON
    const config = JSON.parse(fileContent);
    
    return res.status(200).json({
      message: 'Configuration loaded successfully',
      config: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling load-config request:', error);
    return res.status(500).json({
      message: 'Error loading configuration', 
      error: error.message,
      stack: error.stack
    });
  }
}