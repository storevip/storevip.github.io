import React from 'react';
import { createRoot } from 'react-dom/client';
import HeroFluidGlass from './HeroFluidGlass.jsx';
import ShapeWaves from './ShapeWaves.jsx';
import MobileShapeWaves from './MobileShapeWaves.jsx';

const heroMount = document.getElementById('heroFluidGlassMount');
if (heroMount) createRoot(heroMount).render(<HeroFluidGlass />);

const wavesMount = document.getElementById('heroShapeWavesMount');
if (wavesMount) {
  const wavesRoot = createRoot(wavesMount);
  const fallback = matchMedia('(pointer: coarse)').matches || !navigator.gpu;
  wavesRoot.render(fallback ? <MobileShapeWaves /> : (
    <ShapeWaves
      shapes="mixed"
      cellSize={10}
      dotSize={0.75}
      color="#FFDB01"
      hoverColor="#ffd657"
      backgroundColor="#000000"
      speed={2.2}
      scale={0.6}
      contrast={1}
      brightness={0.4}
      fade={0}
      glow={0}
      interactive
      splashStrength={0.55}
      intro
      introDuration={1.6}
      onError={error => {
        console.error('[ShapeWaves] WebGPU initialization failed:', error);
        wavesMount.dataset.failed = 'true';
        wavesRoot.render(<MobileShapeWaves />);
      }}
    />
  ));
}

import NavigationWheel from './NavigationWheel.jsx';
const navigationMount = document.createElement('div');
navigationMount.id = 'navigationWheelMount';
document.body.appendChild(navigationMount);
createRoot(navigationMount).render(<NavigationWheel />);

// Keep the reference line-width proportions independent of font metrics/device.
const fitTitle = () => {
  const title = document.querySelector('.english-layer .title-plane');
  if (!title) return;
  const unit = parseFloat(getComputedStyle(title).fontSize);
  const widths = [3.576, 5.26, 6.884, 4.541];
  title.querySelectorAll('.type-fit').forEach((line, index) => {
    line.style.setProperty('--type-scale', String(unit * widths[index] / Math.max(1, line.offsetWidth)));
  });
};
document.fonts.ready.then(fitTitle);
window.addEventListener('resize', fitTitle);
