/*
 * HeroFluidGlass.jsx
 * A project-specific React/Three adapter inspired by the public ReactBits FluidGlass
 * rendering model: render the underlying scene into an FBO, then feed that buffer
 * into MeshTransmissionMaterial. This version keeps the existing V6 hero intact
 * and uses the live Shape Waves canvas + hidden Chinese DOM layout as the refracted source.
 */
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, useFBO, useGLTF } from '@react-three/drei';
import './HeroFluidGlass.css';

const MOBILE = matchMedia('(pointer: coarse)').matches;
const MAX_DPR = MOBILE ? 1 : 2;

function useLiveCanvasTexture(selector) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let stopped = false;
    let raf = 0;
    let currentTexture = null;

    let connectedCanvas = null;
    let connectedSize = '';
    const connect = () => {
      if (stopped) return;
      const canvas = document.querySelector(selector);
      const size = canvas ? `${canvas.width}x${canvas.height}` : '';
      if (canvas instanceof HTMLCanvasElement && canvas.dataset.frameReady === 'true' &&
          (canvas !== connectedCanvas || size !== connectedSize)) {
        const next = new THREE.CanvasTexture(canvas);
        next.colorSpace = THREE.SRGBColorSpace;
        next.minFilter = THREE.LinearFilter;
        next.magFilter = THREE.LinearFilter;
        next.generateMipmaps = false;
        currentTexture?.dispose();
        currentTexture = next;
        connectedCanvas = canvas;
        connectedSize = size;
        setTexture(next);
      }
      raf = requestAnimationFrame(connect);
    };

    connect();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      currentTexture?.dispose();
    };
  }, [selector]);

  return texture;
}

function makeTextTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function HeroGlassScene({ heroSelector = '.hero-home', fieldSelector = '#heroShapeWavesMount .shape-waves__lens-source' }) {
  const heroRef = useRef(null);
  const lensRef = useRef(null);
  const matRef = useRef(null);
  const bgPlaneRef = useRef(null);
  const textPlaneRef = useRef(null);
  const lastViewportRef = useRef({ width: 0, height: 0, dpr: 0 });

  const fieldTexture = useLiveCanvasTexture(fieldSelector);
  const { canvas: textCanvas, texture: textTexture } = useMemo(makeTextTexture, []);
  const probeCanvas = useMemo(() => document.createElement('canvas'), []);
  const probeContext = useMemo(() => probeCanvas.getContext('2d', { willReadFrequently: true }), [probeCanvas]);
  const probeElapsed = useRef(0);
  const textPresence = useRef(0);
  const textPresenceTarget = useRef(0);
  const [offscreenScene] = useState(() => new THREE.Scene());
  const buffer = useFBO({ depthBuffer: false, stencilBuffer: false, samples: 0 });
  const { gl, camera, viewport, size } = useThree();

  const { nodes } = useGLTF('/assets/3d/lens.glb');
  const lensGeometry = useMemo(() => {
    const geometry = nodes.Cylinder.geometry.clone();
    geometry.rotateX(Math.PI / 2);
    geometry.center();
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    geometry.scale(2 / size.x, 2 / size.y, 2 / size.z);
    geometry.computeVertexNormals();
    return geometry;
  }, [nodes]);

  useEffect(() => {
    heroRef.current = document.querySelector(heroSelector);
    return () => {
      lensGeometry.dispose();
      textTexture.dispose();
    };
  }, [heroSelector, lensGeometry, textTexture]);

  const paintChineseTexture = () => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));
    const last = lastViewportRef.current;

    if (nextWidth !== textCanvas.width || nextHeight !== textCanvas.height || last.dpr !== dpr) {
      textCanvas.width = nextWidth;
      textCanvas.height = nextHeight;
      lastViewportRef.current = { width: rect.width, height: rect.height, dpr };
    }

    const ctx = textCanvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = hero.querySelectorAll('.chinese-layer .title-plane span');
    for (const line of lines) {
      const box = line.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const style = getComputedStyle(line);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing;
      // Center the words themselves; hang punctuation outside their width.
      const text = line.textContent.trim();
      const punctuation = /[，。]$/.test(text) ? text.slice(-1) : '';
      const words = punctuation ? text.slice(0, -1) : text;
      const wordElement = line.querySelector('.chinese-word');
      const baseline = line.querySelector('.chinese-baseline');
      if (!wordElement || !baseline) continue;
      const wordBox = wordElement.getBoundingClientRect();
      const baselineY = baseline.getBoundingClientRect().top - rect.top;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText(words, wordBox.left - rect.left, baselineY);
      if (punctuation) {
        const punctuationBox = line.querySelector('.chinese-punctuation').getBoundingClientRect();
        ctx.fillText(punctuation, punctuationBox.left - rect.left, baselineY);
      }
    }

    textTexture.needsUpdate = true;
  };

  useEffect(() => {
    document.fonts?.ready?.then(() => {
      paintChineseTexture();
    });
  });

  useFrame((state, delta) => {
    const hero = heroRef.current;
    if (!hero || !fieldTexture) return;

    if (fieldTexture) fieldTexture.needsUpdate = true;
    paintChineseTexture();

    const heroRect = hero.getBoundingClientRect();
    const lx = parseFloat(hero.style.getPropertyValue('--lx')) || heroRect.width * 0.62;
    const ly = parseFloat(hero.style.getPropertyValue('--ly')) || heroRect.height * 0.46;
    const radius = Math.max(0, parseFloat(hero.style.getPropertyValue('--radius')) || 0);
    const opacity = THREE.MathUtils.clamp(parseFloat(hero.style.getPropertyValue('--lens-opacity')) || 0, 0, 1);
    const glassStrength = THREE.MathUtils.clamp(parseFloat(hero.style.getPropertyValue('--glass-strength')) || 1, 0, 1);
    const lensSpeed = THREE.MathUtils.clamp(parseFloat(hero.style.getPropertyValue('--lens-speed')) || 0, 0, 1);
    const lensGrowth = THREE.MathUtils.clamp(parseFloat(hero.style.getPropertyValue('--lens-growth')) || 0, 0, 1);

    // Probe the actual Chinese glyph pixels inside the lens circle at a small size.
    // This avoids showing an empty amber orb when the lens is over blank space.
    probeElapsed.current += delta;
    if (probeElapsed.current >= 0.03 && probeContext) {
      probeElapsed.current %= 0.03;
      const probeHeight = 180;
      const probeWidth = Math.max(1, Math.round(probeHeight * heroRect.width / Math.max(1, heroRect.height)));
      if (probeCanvas.width !== probeWidth || probeCanvas.height !== probeHeight) {
        probeCanvas.width = probeWidth;
        probeCanvas.height = probeHeight;
      }
      probeContext.clearRect(0, 0, probeWidth, probeHeight);
      probeContext.drawImage(textCanvas, 0, 0, probeWidth, probeHeight);
      const image = probeContext.getImageData(0, 0, probeWidth, probeHeight);
      const cx = lx / Math.max(1, heroRect.width) * probeWidth;
      const cy = ly / Math.max(1, heroRect.height) * probeHeight;
      const rx = radius / Math.max(1, heroRect.width) * probeWidth;
      const ry = radius / Math.max(1, heroRect.height) * probeHeight;
      let containsText = false;
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(probeHeight - 1, Math.ceil(cy + ry)) && !containsText; y++) {
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(probeWidth - 1, Math.ceil(cx + rx)); x++) {
          const dx = (x - cx) / Math.max(rx, 0.001);
          const dy = (y - cy) / Math.max(ry, 0.001);
          if (dx * dx + dy * dy <= 1 && image.data[(y * probeWidth + x) * 4 + 3] > 18) {
            containsText = true;
            break;
          }
        }
      }
      textPresenceTarget.current = containsText ? 1 : 0;
    }
    textPresence.current = THREE.MathUtils.damp(textPresence.current, textPresenceTarget.current, textPresenceTarget.current ? 10 : 22, delta);
    const visibleOpacity = opacity * Math.max(textPresence.current, THREE.MathUtils.smoothstep(lensGrowth, 0, 0.12));
    hero.style.setProperty('--lens-reveal', String(visibleOpacity));
    // Settle the optical effect first, then hand over to the native Chinese layer.
    const glassSettle = THREE.MathUtils.smoothstep(lensGrowth, 0.48, 0.86);
    const departure = THREE.MathUtils.clamp(parseFloat(hero.style.getPropertyValue('--lens-departure')) || 0, 0, 1);
    const opticalSettle = Math.max(glassSettle, departure);
    const crispReveal = THREE.MathUtils.smoothstep(lensGrowth, 0.86, 0.98);
    hero.style.setProperty('--chinese-crisp', String(crispReveal * opacity));

    const sceneViewport = viewport.getCurrentViewport(camera, [0, 0, 0]);
    bgPlaneRef.current?.scale.set(sceneViewport.width, sceneViewport.height, 1);
    textPlaneRef.current?.scale.set(sceneViewport.width, sceneViewport.height, 1);

    if (lensRef.current) {
      const lensViewport = viewport.getCurrentViewport(camera, [0, 0, 15]);
      const targetX = ((lx / Math.max(1, heroRect.width)) - 0.5) * lensViewport.width;
      const targetY = (0.5 - (ly / Math.max(1, heroRect.height))) * lensViewport.height;
      const worldRadius = Math.max(0.0001, radius / Math.max(1, heroRect.width) * lensViewport.width);

      // hero.js already eases the shared lens center; do not add a second lag here.
      lensRef.current.position.set(targetX, targetY, 15);

      const tiltY = THREE.MathUtils.clamp(targetX / Math.max(0.001, lensViewport.width * 0.5), -1, 1) * 0.045;
      const tiltX = THREE.MathUtils.clamp(-targetY / Math.max(0.001, lensViewport.height * 0.5), -1, 1) * 0.035;
      lensRef.current.rotation.x = THREE.MathUtils.lerp(lensRef.current.rotation.x, tiltX * (1 - opticalSettle), 0.08);
      lensRef.current.rotation.y = THREE.MathUtils.lerp(lensRef.current.rotation.y, tiltY * (1 - opticalSettle), 0.08);

      const zScale = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.2, 0.26, glassStrength), 0.001, opticalSettle);
      lensRef.current.scale.set(worldRadius, worldRadius, worldRadius * zScale);
      lensRef.current.visible = visibleOpacity > 0.002 && radius > 0.5 && crispReveal < 1;
    }

    if (matRef.current) {
      matRef.current.ior = THREE.MathUtils.lerp(1.035, 1, opticalSettle);
      matRef.current.thickness = 0.65 * (1 - opticalSettle);
      matRef.current.chromaticAberration = 0.06 * (1 - glassSettle);
      matRef.current.anisotropy = 0.01 * (1 - glassSettle);
      // Native text sits beneath the glass. Keep it opaque during the handoff
      // so two partially transparent copies cannot make the white text gray.
      hero.style.setProperty('--chinese-crisp', String(crispReveal > 0 ? opacity : 0));
      matRef.current.opacity = visibleOpacity * (1 - crispReveal);
    }

    const previousTarget = gl.getRenderTarget();
    const previousColor = gl.getClearColor(new THREE.Color()).clone();
    const previousAlpha = gl.getClearAlpha();
    const previousAutoClear = gl.autoClear;

    gl.autoClear = true;
    gl.setRenderTarget(buffer);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
    gl.render(offscreenScene, camera);
    gl.setRenderTarget(previousTarget);
    gl.setClearColor(previousColor, previousAlpha);
    gl.autoClear = previousAutoClear;
  }, -1);



  if (!fieldTexture) return null;

  return (
    <>
      {createPortal(
        <>
          <mesh ref={bgPlaneRef} position={[0, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={fieldTexture} toneMapped={false} />
          </mesh>
          <mesh ref={textPlaneRef} position={[0, 0, 0]} renderOrder={1}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={textTexture}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>,
        offscreenScene
      )}

      <mesh ref={lensRef} geometry={lensGeometry} position={[0, 0, 15]} renderOrder={4}>
        <MeshTransmissionMaterial
          ref={matRef}
          buffer={buffer.texture}
          transmission={1}
          ior={1.035}
          thickness={0.65}
          chromaticAberration={0.06}
          anisotropy={0.01}
          roughness={0}
          samples={MOBILE ? 6 : 12}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

    </>
  );
}

export default function HeroFluidGlass() {
  return (
    <div className="hero-fluid-glass" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 15, near: 0.1, far: 100 }}
        dpr={[1, MAX_DPR]}
        gl={{
          alpha: true,
          antialias: !MOBILE,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
          premultipliedAlpha: false
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <HeroGlassScene />
      </Canvas>
    </div>
  );
}
