import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const BrainSphere = () => {
  const mountRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Scene objects refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef([]);
  const channelMapping = useRef({});
  const sphereRef = useRef(null);
  const connectionsRef = useRef([]);
  
  // Configuration
  const sphereRadius = 5;
  const updateInterval = 500; // ms
  
  // Fetch data from the API
  const fetchData = async () => {
    try {
      const response = await fetch('/api/brain-data');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const newData = await response.json();
      setData(newData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching brain data:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Initialize the Three.js scene
  const initScene = () => {
    if (!mountRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;
    
    // Create brain sphere
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    sphereRef.current = sphere;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.001;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  };
  
  // Create electrode points on the sphere
  const createElectrodePoints = () => {
    if (!sceneRef.current) return;
    
    // Clear previous points
    pointsRef.current.forEach(point => {
      sceneRef.current.remove(point);
    });
    pointsRef.current = [];
    
    // Create points for each channel position
    const channels = [];
    for (let i = 0; i < 16; i++) {
      channels.push({ name: `A${i}`, id: i });
      channels.push({ name: `B${i}`, id: i + 16 });
    }
    
    // Distribute points on the sphere using spherical coordinates
    channels.forEach((channel, index) => {
      // Calculate position on sphere (Fibonacci distribution)
      const phi = Math.acos(-1 + (2 * index) / channels.length);
      const theta = Math.sqrt(channels.length * Math.PI) * phi;
      
      const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
      const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
      const z = sphereRadius * Math.cos(phi);
      
      // Create point geometry
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const point = new THREE.Mesh(geometry, material);
      
      point.position.set(x, y, z);
      sceneRef.current.add(point);
      
      // Store reference to point
      pointsRef.current.push(point);
      channelMapping.current[channel.name] = {
        index,
        point,
        position: new THREE.Vector3(x, y, z)
      };
      
      // Add channel name label
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(channel.name, 5, 16);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: texture });
      const label = new THREE.Sprite(labelMaterial);
      label.position.set(x * 1.2, y * 1.2, z * 1.2);
      label.scale.set(2, 1, 1);
      sceneRef.current.add(label);
      pointsRef.current.push(label);
    });
  };
  
  // Update points based on brain data
  const updatePoints = () => {
    if (!data || !data.activeChannels || !sceneRef.current) return;
    
    // Clear previous connections
    connectionsRef.current.forEach(line => {
      sceneRef.current.remove(line);
    });
    connectionsRef.current = [];
    
    // Update points based on activity
    data.activeChannels.forEach(channel => {
      const channelInfo = channelMapping.current[channel.name];
      if (!channelInfo) return;
      
      const point = channelInfo.point;
      
      // Update color based on activity level
      let color;
      if (channel.activityLevel >= 75) {
        color = 0xff0000; // Red - high activity
      } else if (channel.activityLevel >= 50) {
        color = 0xffff00; // Yellow - medium activity
      } else if (channel.activityLevel >= 25) {
        color = 0x00ff00; // Green - low activity
      } else {
        color = 0x00ffff; // Cyan - very low activity
      }
      
      // Update point appearance
      point.material.color.setHex(color);
      point.scale.setScalar(1.0 + (channel.activityLevel / 100));
      
      // Pulse effect for active channels
      const pulse = () => {
        const scale = 1.0 + (channel.activityLevel / 100) + 0.2 * Math.sin(Date.now() * 0.005);
        point.scale.setScalar(scale);
      };
      
      pulse();
      
      // Only create connections between highly active channels
      if (channel.activityLevel >= 50) {
        // Find other active channels to connect with
        data.activeChannels.forEach(otherChannel => {
          if (otherChannel.name === channel.name || otherChannel.activityLevel < 50) return;
          
          const otherChannelInfo = channelMapping.current[otherChannel.name];
          if (!otherChannelInfo) return;
          
          // Create a connection line
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            channelInfo.position,
            otherChannelInfo.position
          ]);
          
          // Calculate strength based on both channels' activity
          const strength = (channel.activityLevel + otherChannel.activityLevel) / 200;
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: strength
          });
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          sceneRef.current.add(line);
          connectionsRef.current.push(line);
        });
      }
    });
    
    // Make inactive points faded
    Object.entries(channelMapping.current).forEach(([name, info]) => {
      const isActive = data.activeChannels.some(ch => ch.name === name);
      if (!isActive && info.point) {
        info.point.material.color.setHex(0x444444);
        info.point.scale.setScalar(0.7);
      }
    });
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    const cleanup = initScene();
    createElectrodePoints();
    
    // Initial data fetch
    fetchData();
    
    // Set up interval for data updates
    const interval = setInterval(fetchData, updateInterval);
    
    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
    };
  }, []);
  
  // Update visualization when data changes
  useEffect(() => {
    if (data) {
      updatePoints();
    }
  }, [data]);
  
  return (
    <div className="brain-sphere-container">
      <div 
        ref={mountRef} 
        style={{ width: '100%', height: '100%', minHeight: '600px' }}
      />
      {loading && <div className="loading-overlay">Loading brain data...</div>}
      {error && <div className="error-overlay">Error: {error}</div>}
      {data && (
        <div className="data-info">
          <div>Active Channels: {data.activeChannels?.length || 0}</div>
          <div>Total Transitions: {data.totalTransitions || 0}</div>
          <div>Last Updated: {new Date(data.timestamp).toLocaleTimeString()}</div>
        </div>
      )}
      
      <style jsx>{`
        .brain-sphere-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .loading-overlay, .error-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
        }
        
        .error-overlay {
          background: rgba(255, 0, 0, 0.7);
        }
        
        .data-info {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default BrainSphere;