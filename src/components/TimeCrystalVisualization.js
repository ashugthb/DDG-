// components/TimeCrystal.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const totalChannels = 12;
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const initialRadius = 40;

export default function TimeCrystal() {
  const mountRef = useRef(null);
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    rootPivot: null,
    pivots: [],
    nodesByLevel: {},
    rotMap: {},
    autoTimer: null,
  });
  const isPausedRef = useRef(false);

  const [jsonText, setJsonText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  // Initialize Three.js and fetch data
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Setup scene, camera, renderer
    const { clientWidth: W, clientHeight: H } = mount;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(60, W / H, 1, 2000);
    camera.position.set(0, 0, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6).position.set(0, 200, 0));
    const dl1 = new THREE.DirectionalLight(0xffffff, 0.8); dl1.position.set(100, 100, 100); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.4); dl2.position.set(-100, -50, -100); scene.add(dl2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    Object.assign(threeRef.current, { scene, camera, renderer, controls, pivots: [] });

    // Handle resize
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      if (!isPausedRef.current) {
        threeRef.current.pivots.forEach(g => g.rotation.y += 0.01);
      }
      renderer.render(scene, camera);
    };
    animate();

    // Fetch data and draw
    fetchAndDraw();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(threeRef.current.autoTimer);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Fetch brain-data and draw
  const fetchAndDraw = async () => {
    try {
      const res = await fetch('/api/brain-data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.brainData) throw new Error('No brainData');
      const config = data.brainData.reduce((acc, brain) => {
        acc[brain.id] = Array.isArray(brain.channels)
          ? brain.channels.map(c => c.channel)
          : [];
        return acc;
      }, {});
      const formatted = JSON.stringify(config, null, 2);
      setJsonText(formatted);
      drawStructure(config);
    } catch (err) {
      console.error('fetchAndDraw error:', err);
    }
  };

  // Build sphere hierarchy
  const drawStructure = (config) => {
    const R = threeRef.current;
    if (!R.scene) return;

    // Preserve rotations
    R.rotMap = {};
    R.pivots.forEach(p => {
      if (p.userData?.id) R.rotMap[p.userData.id] = p.rotation.y;
    });

    // Clear previous
    if (R.rootPivot) R.scene.remove(R.rootPivot);
    R.pivots = [];
    R.nodesByLevel = {};

    // Root
    const root = new THREE.Group();
    R.scene.add(root);
    R.pivots.push(root);
    R.rootPivot = root;
    root.userData = { actualRadius: initialRadius * 0.5, channel: null, level: -1, id: 'root' };
    root.add(new THREE.Mesh(
      new THREE.SphereGeometry(initialRadius * 0.5, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 10, specular: 0x222222 })
    ));
    R.nodesByLevel[-1] = [root];

    // Levels
    Object.keys(config).map(Number).sort((a, b) => a - b).forEach(level => {
      const arr = Array.isArray(config[level]) ? config[level] : [];
      if (arr.length === 0) { R.nodesByLevel[level] = []; return; }

      // Parent search
      let pl = level - 1;
      while (pl >= -1 && (!R.nodesByLevel[pl] || R.nodesByLevel[pl].length === 0)) pl--;
      const parents = pl >= -1 ? R.nodesByLevel[pl] : [root];

      // Group channels
      const groups = new Map();
      arr.forEach((ch, idx) => {
        let best = parents[0];
        let bd = channelDistance(ch, best.userData.channel);
        parents.forEach(pv => {
          const d = channelDistance(ch, pv.userData.channel);
          if (d < bd) { bd = d; best = pv; }
        });
        if (!groups.has(best)) groups.set(best, []);
        groups.get(best).push({ channel: ch, idx });
      });

      // Create
      const created = [];
      groups.forEach((children, parentPivot) => {
        const n = children.length;
        children.forEach(({ channel, idx }) => {
          const pR = parentPivot.userData.actualRadius;
          const cR = calculateOptimalChildSize(pR, n, level);
          const rL = calculateHalfInsideDistance(pR, cR) * 1.4;

          const { x, y, z } = specialCoords(n, idx);
          const pos = new THREE.Vector3(x, y, z).multiplyScalar(rL);

          const pivot = new THREE.Group();
          pivot.position.copy(pos);
          parentPivot.add(pivot);
          R.pivots.push(pivot);

          pivot.userData = { actualRadius: cR, channel, level, id: `${level}_${channel}_${idx}` };
          pivot.add(new THREE.Mesh(
            new THREE.SphereGeometry(cR, 16, 16),
            new THREE.MeshPhongMaterial({
              color: new THREE.Color(`hsl(${(level * 60) % 360},70%,50%)`),
              shininess: 10,
              specular: 0x222222
            })
          ));
          created.push(pivot);
        });
      });
      R.nodesByLevel[level] = created;
    });

    // Restore
    R.pivots.forEach(p => {
      const id = p.userData?.id;
      if (id in R.rotMap) p.rotation.y = R.rotMap[id];
    });
  };

  // Controls
  const updateVisualization = () => {
    try {
      const cfg = JSON.parse(jsonText);
      drawStructure(cfg);
    } catch {
      alert('Invalid JSON');
    }
  };

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(isPausedRef.current);
  };

  const toggleAuto = () => {
    if (threeRef.current.autoTimer) {
      clearInterval(threeRef.current.autoTimer);
      threeRef.current.autoTimer = null;
      setAutoRunning(false);
    } else {
      fetchAndDraw();
      threeRef.current.autoTimer = setInterval(fetchAndDraw, 2000);
      setAutoRunning(true);
    }
  };

  // Helpers
  function specialCoords(n, i) {
    if (n <= 0) return { x: 0, y: 0, z: 1 };
    let x = 0, y = 0, z = 1;
    switch (n) {
      case 1:
        return { x: 0, y: 0, z: 1 };
      case 2:
        x = i === 0 ? 1 : -1; y = 0; z = 0; break;
      case 3: {
        const θ = (i * 120) * Math.PI / 180;
        x = Math.cos(θ); y = 0; z = Math.sin(θ);
        break;
      }
      case 4: {
        const C = [[0,0,1],[0.943,0,-0.333],[-0.471,0.816,-0.333],[-0.471,-0.816,-0.333]];
        [x,y,z] = C[i % 4]; break;
      }
      case 5:
      case 6:
      case 8:
        // fall-through to Fibonacci sphere default
      default: {
        y = 1 - (2 * (i + 0.5) / n);
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        const θ = goldenAngle * i;
        x = rr * Math.cos(θ);
        z = rr * Math.sin(θ);
      }
    }
    return { x, y, z };
  }
  function calculateOptimalChildSize(pR, n, level) {
    const base = level === 0
      ? initialRadius * 0.3
      : initialRadius * (0.2 / Math.pow(1.5, level - 1));
    const f = Math.min(1, 2 / Math.sqrt(n));
    return Math.min(base * f, pR * 0.7);
  }
  function calculateHalfInsideDistance(pR, cR) {
    return Math.max(pR - cR * 0.5, cR * 0.3);
  }
  function channelDistance(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') return Infinity;
    const d = Math.abs(a - b);
    return Math.min(d, totalChannels - d);
  }

  return (
    <>  
      <textarea
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
        style={{
          position: 'absolute', top: 10, left: 10,
          width: 320, height: 120,
          background: '#333', color: '#fff',
          fontFamily: 'monospace', border: '1px solid #555',
          padding: 6, zIndex: 10
        }}
      />
      <div style={{ position: 'absolute', top: 140, left: 10, zIndex: 10 }}>
        <button onClick={togglePause} style={{ background: '#d9534f', color: '#fff', marginRight: 8 }}>
          {isPaused ? 'Resume Rotation' : 'Pause Rotation'}
        </button>
        <button onClick={updateVisualization} style={{ background: '#5cb85c', color: '#000', marginRight: 8 }}>
          Update
        </button>
        <button onClick={toggleAuto} style={{ background: '#0275d8', color: '#fff' }}>
          {autoRunning ? 'Stop Auto' : 'Start Auto'}
        </button>
      </div>
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    </>
  );
}


