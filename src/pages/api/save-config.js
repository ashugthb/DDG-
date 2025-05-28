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
    
    // Sanitize file path to prevent directory traversal attacks
    // Make sure we're only writing to public/data directory
    let sanitizedPath = filePath.replace(/^\/public\//, '');
    
    // Ensure path starts with public/
    if (!sanitizedPath.startsWith('public/')) {
      sanitizedPath = 'public/' + sanitizedPath;
    }
    
    // Get the absolute path
    const absPath = path.join(process.cwd(), sanitizedPath);
    
    // Ensure the directory exists
    const dirPath = path.dirname(absPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(absPath, content);
    
    return res.status(200).json({ 
      message: 'Configuration saved successfully',
      path: absPath
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return res.status(500).json({ 
      message: 'Error saving configuration', 
      error: error.message 
    });
  }
}