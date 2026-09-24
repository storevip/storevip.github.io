import { useEffect, useRef } from 'react';

// Canvas fallback for touch devices and browsers without WebGPU (including LAN HTTP).
export default function MobileShapeWaves() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let frame, last = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = time => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || time - last < 50) return;
      last = time;
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const w = Math.round(rect.width), h = Math.round(rect.height);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      const t = reduced ? 0 : time * .00024;
      for (let y = 6; y < h; y += 12) for (let x = 6; x < w; x += 12) {
        const field = Math.sin(x * .013 + t) + Math.cos(y * .009 - t * .8) + Math.sin((x + y) * .007 + t * .5);
        const size = 3.1 + Math.sin(field + t) * 1.1;
        ctx.fillStyle = `rgba(255,219,1,${.13 + (field + 3) / 6 * .53})`;
        const type = Math.floor((field + 3) * 1.7) % 3;
        ctx.beginPath();
        if (type === 0) ctx.arc(x, y, size, 0, Math.PI * 2);
        else if (type === 1) ctx.rect(x-size, y-size, size*2, size*2);
        else { ctx.moveTo(x,y-size); ctx.lineTo(x+size,y+size); ctx.lineTo(x-size,y+size); ctx.closePath(); }
        ctx.fill();
      }
      canvas.dataset.frameReady = 'true';
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} className="shape-waves__lens-source" style={{width:'100%',height:'100%',display:'block'}} aria-hidden="true" />;
}
