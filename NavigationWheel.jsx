import React, { useEffect, useRef, useState } from 'react';
import OptionWheel from './OptionWheel';
import './NavigationWheel.css';

const items = ['Home', 'About', 'Work', 'Motion', 'Poster', 'Branding', 'Digital', 'Photography'];
export default function NavigationWheel() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const update = () => setLight(document.documentElement.dataset.menuSurface === 'light');
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-menu-surface'] });
    update();
    return () => observer.disconnect();
  }, []);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const toggle = useRef(null);
  const panel = useRef(null);
  useEffect(() => {
    const loader = document.getElementById('loader');
    const update = () => { const done = loader.style.display === 'none'; setReady(done); if (!done) setOpen(false); };
    const observer = new MutationObserver(update);
    observer.observe(loader, { attributes: true, attributeFilter: ['style'] });
    update();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const app = document.getElementById('app');
    app.inert = true;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    panel.current?.querySelector('[role="listbox"]')?.focus();
    const key = e => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const controls = [panel.current?.querySelector('[role="listbox"]'), toggle.current].filter(Boolean);
        const current = controls.indexOf(document.activeElement);
        e.preventDefault(); controls[(current + (e.shiftKey ? controls.length - 1 : 1)) % controls.length].focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => { app.inert = false; document.documentElement.style.overflow = previousOverflow; window.removeEventListener('keydown', key); toggle.current?.focus(); };
  }, [open]);
  const navigate = (index) => {
    const journey = document.getElementById('heroJourney');
    const max = journey.offsetHeight - innerHeight;
    const progress = index === 0 ? 0 : index === 1 ? (.78 / 1.78) : 1;
    setOpen(false);
    requestAnimationFrame(() => window.scrollTo({ top: journey.offsetTop + max * progress, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  };
  return <div className={`wheel-navigation${ready ? ' is-ready' : ''}${open ? ' is-open' : ''}${light ? ' is-light' : ''}`}>
    <div className="wheel-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
    <div ref={panel} id="wheel-menu" className="wheel-panel" role="dialog" aria-modal={open ? true : undefined} aria-label="网站导航" inert={!open}>
      {open && <OptionWheel items={items} defaultSelected={selected} textColor={light ? "#45453e" : "#a6a6a6"} activeColor={light ? "#171714" : "#ffffff"} side="right" fontSize={3} spacing={1.65} curve={1.3} tilt={9} blur={2} fade={.25} smoothing={200} inset={80} loop draggable soundUrl="/sounds/click-soft.wav" soundVolume={.5} onChange={index => setSelected(index)} onActivate={navigate} />}
    </div>
    <button ref={toggle} className="wheel-toggle" aria-label={open ? '关闭导航' : '打开导航'} aria-expanded={open} aria-controls="wheel-menu" onClick={() => setOpen(value => !value)} tabIndex={ready ? 0 : -1}><span /><span /></button>
  </div>;
}
