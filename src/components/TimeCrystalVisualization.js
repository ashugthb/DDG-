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
    autoTimer: null
  });
  const isPausedRef = useRef(false);
  const lastTransitionsRef = useRef({});

  const [jsonText, setJsonText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  // Initialize Three.js and fetch initial data
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const { clientWidth: W, clientHeight: H } = mount;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(60, W / H, 1, 2000);
    camera.position.set(0, 0, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6).position.set(0, 200, 0));
    const dl1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dl1.position.set(100, 100, 100); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dl2.position.set(-100, -50, -100); scene.add(dl2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    Object.assign(threeRef.current, { scene, camera, renderer, controls, pivots: [] });

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      if (!isPausedRef.current) {
        threeRef.current.pivots.forEach(g => g.rotation.y += 0.01);
      }
      renderer.render(scene, camera);
    };
    animate();

    fetchAndDraw();
     threeRef.current.autoTimer = setInterval(fetchAndDraw, 2000);
  setAutoRunning(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      clearInterval(threeRef.current.autoTimer);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Fetch from API and redraw
  const fetchAndDraw = async () => {
  try {
    const res = await fetch('/api/brain-data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { brainData } = await res.json();
    if (!Array.isArray(brainData)) throw new Error('Invalid data');

    const config = brainData.reduce((acc, brain) => {
  const arr = [];
  if (Array.isArray(brain.channels)) {
    brain.channels
      .filter(c => c.activityLevel > 0) // Only active
      .forEach(c => {
        // Always one
        arr.push(c.channel);

        // Add extras for activityLevel > 5
        const threshold = 90;
        if (c.activityLevel > threshold) {
          // One extra per 'threshold' above 5
          const extra = Math.floor((c.activityLevel - threshold) / threshold) + 1;
          for (let i = 0; i < extra; i++) {
            arr.push(c.channel);
          }
        }
      });
  }
  acc[brain.id] = arr;
  return acc;
}, {});
    setJsonText(JSON.stringify(config, null, 2));
    drawStructure(config);

  } catch (err) {
    console.error('fetchAndDraw error:', err);
  }
};

  // Build and render sphere hierarchy
  const drawStructure = (config) => {
    const R = threeRef.current;
    if (!R.scene) return;

    R.rotMap = {};
    R.pivots.forEach(p => {
      if (p.userData?.id) R.rotMap[p.userData.id] = p.rotation.y;
    });

    if (R.rootPivot) R.scene.remove(R.rootPivot);
    R.pivots = [];
    R.nodesByLevel = {};

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

    Object.keys(config).map(Number).sort((a, b) => a - b).forEach(level => {
      const arr = Array.isArray(config[level]) ? config[level] : [];
      if (!arr.length) { R.nodesByLevel[level] = []; return; }

      let pl = level - 1;
      while (pl >= -1 && (!R.nodesByLevel[pl] || !R.nodesByLevel[pl].length)) pl--;
      const parents = pl >= -1 ? R.nodesByLevel[pl] : [root];

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

      const created = [];
      groups.forEach((children, parentPivot) => {
        children.forEach(({ channel, idx }) => {
          const pR = parentPivot.userData.actualRadius;
          const cR = calculateOptimalChildSize(pR, children.length, level) ;
                    // Position child 40% inside parent using helper
          const rL = calculateHalfInsideDistance(pR, cR) * 1.3;

          const { x, y, z } = specialCoords(children.length, idx);
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
              shininess: 10, specular: 0x222222
            })
          ));
          created.push(pivot);
        });
      });
      R.nodesByLevel[level] = created;
    });

    R.pivots.forEach(p => {
      const id = p.userData?.id;
      if (id && R.rotMap[id] != null) p.rotation.y = R.rotMap[id];
    });
  };

  // Controls handlers
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

  // Helper functions
  function specialCoords(n, i) {
    if (n <= 1) return { x: 0, y: 0, z: 1 };
    let x = 0, y = 0, z = 1;
    switch (n) {
      case 2:
        x = i === 0 ? 1 : -1; y = 0; z = 0; break;
      case 3: {
        const θ = (i * 120) * Math.PI / 180; x = Math.cos(θ); y = 0; z = Math.sin(θ);
        break;
      }
      case 4: {
        const C = [[0,0,1],[0.943,0,-0.333],[-0.471,0.816,-0.333],[-0.471,-0.816,-0.333]];
        [x, y, z] = C[i % 4]; break;
      }
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

  // Render UI
  return (
    <>      
      {/* JSON input on the right, auto-sizing with content */}
      <textarea
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
        style={{
          position: 'absolute',
          top: 10,
         left: 10,
          width: '30vw',
          maxWidth: '400px',
          minWidth: '200px',
          height: 'auto',
          maxHeight: '50vh',
          overflow: 'auto',
          background: '#222',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          border: '1px solid #0f0',
          padding: '8px',
          borderRadius: '4px',
          zIndex: 10
        }}
      />

      {/* Control buttons in a top-right panel */}
      <div style={{
        position: 'absolute',
        top: 'calc(10px + 1em)', // below textarea
        right: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10
      }}>
        <button onClick={togglePause} style={{
          padding: '6px 12px',
          background: '#d9534f',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          {isPaused ? 'Resume Rotation' : 'Pause Rotation'}
        </button>
        <button onClick={updateVisualization} style={{
          padding: '6px 12px',
          background: '#5cb85c',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Update
        </button>
        <button onClick={toggleAuto} style={{
          padding: '6px 12px',
          background: '#0275d8',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          {autoRunning ? 'Stop Auto' : 'Start Auto'}
        </button>
      </div>

      {/* Canvas mount area */}
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    </>
  );
}



