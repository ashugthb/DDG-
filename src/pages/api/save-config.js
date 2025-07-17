// pages/api/save-config.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filePath, content } = req.body;
    
    if (!filePath || !content) {
      return res.status(400).json({ message: 'File path and content are required' });
    }
    
    console.log('Received request to save configuration:');
    console.log('- Path:', filePath);
    console.log('- Content length:', content.length, 'bytes');
    console.log('- Preview:', content.substring(0, 100) + '...');
    
    // Only allow writing to brain-viz directory for security
    if (!filePath.includes('brain-viz')) {
      return res.status(403).json({ 
        message: 'Security Error: Can only write to brain-viz directory',
        requestedPath: filePath
      });
    }
    
    // Normalize the file path based on OS
    const normalizedPath = filePath.replace(/\//g, '\\');
    console.log('Normalized path:', normalizedPath);
    
    // Ensure the directory exists
    const dirPath = path.dirname(normalizedPath);
    if (!fs.existsSync(dirPath)) {
      console.log('Creating directory:', dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the file with synchronous operation to ensure completion
    try {
      fs.writeFileSync(normalizedPath, content, { encoding: 'utf8' });
      console.log('Successfully wrote file');
      
      // Verify the file exists and report its size
      if (fs.existsSync(normalizedPath)) {
        const stats = fs.statSync(normalizedPath);
        console.log('File size after writing:', stats.size, 'bytes');
      } else {
        console.log('WARNING: File does not exist after writing attempt!');
      }
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      throw writeError;
    }
    
    return res.status(200).json({
      message: 'Configuration saved successfully',
      path: normalizedPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling save-config request:', error);
    return res.status(500).json({
      message: 'Error saving configuration', 
      error: error.message,
      stack: error.stack
    });
  }
}