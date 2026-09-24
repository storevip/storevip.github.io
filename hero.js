import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector('.lens-hero');
const journey = document.querySelector('#heroJourney');
const loader = document.querySelector('#loader');
const nav = document.querySelector('.editorial-nav');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const clamp = gsap.utils.clamp(0, 1);
const mix = (a, b, amount) => a + (b - a) * amount;

let width = innerWidth;
let height = innerHeight;
let live = false;
let inside = false;
let pageFocused = document.hasFocus();
let lastFrame = performance.now();

let targetX = width * .62;
let targetY = height * .46;
let lensX = targetX;
let lensY = targetY;
let visibility = 0;

let pointerVX = 0;
let pointerVY = 0;
let targetVX = 0;
let targetVY = 0;
let previousPointerX = targetX;
let previousPointerY = targetY;
let previousPointerTime = performance.now();

const state = { growth: 0, exit: 0 };
let pageTravel = 0;
let pageVelocity = 0;
gsap.set('.selected-section', { y: 0, yPercent: 100 });
const setPageY = gsap.quickSetter('.selected-section', 'yPercent');
const timeline = gsap.timeline({ paused: true });
timeline.to({}, { duration: 1.78 });

const lineDirections = [
  ['.line-one', -1, .012],
  ['.line-two', 1, .035],
  ['.line-three', -1, .058],
  ['.line-four', 1, .081]
];

function getExitX(target, direction) {
  const rect = target.getBoundingClientRect();
  const overshoot = Math.max(100, innerWidth * .08);
  return direction < 0
    ? -(rect.right + overshoot)
    : innerWidth - rect.left + overshoot;
}

// Alternating line exits. No opacity fade: every line physically clears the viewport.
for (const [lineClass, direction, startAt] of lineDirections) {
  for (const layerClass of ['.english-layer']) {
    timeline.to(`${layerClass} ${lineClass}`, {
      x: (_, target) => getExitX(target, direction),
      duration: .62,
      ease: 'power3.inOut'
    }, startAt);
  }
}

timeline
  .to(state, { growth: .18, duration: .18, ease: 'power1.inOut' }, .27)
  .to(state, { growth: 1, duration: .30, ease: 'power1.inOut' }, .45)
  .to(state, { exit: 1, duration: .96, ease: 'power2.inOut' }, .82)
  .to('.intro-replay', { autoAlpha: 1, duration: .08 }, 1.70);

const trigger = ScrollTrigger.create({
  trigger: journey,
  start: 'top top',
  end: 'bottom bottom',
  animation: timeline,
  scrub: reduced ? true : .28,
  invalidateOnRefresh: true
});
trigger.disable();

function resetPointerVelocity(x = targetX, y = targetY) {
  previousPointerX = x;
  previousPointerY = y;
  previousPointerTime = performance.now();
  targetVX = 0;
  targetVY = 0;
  pointerVX = 0;
  pointerVY = 0;
}

function lock() {
  live = false;
  inside = false;
  document.documentElement.classList.remove('hero-live');
  trigger.disable();
  timeline.progress(0);
  window.scrollTo(0, 0);
  visibility = 0;
  pageTravel = 0;
  pageVelocity = 0;
  setPageY(100);
  hero.style.setProperty('--radius', '1px');
  hero.style.setProperty('--lens-opacity', '0');
  hero.style.setProperty('--glass-strength', '1');
  hero.style.setProperty('--lens-speed', '0');
  hero.style.setProperty('--lens-growth', '0');
  hero.style.setProperty('--lens-reveal', '0');
}

function unlock() {
  if (live) return;
  live = true;
  document.documentElement.classList.add('hero-live');
  resetPointerVelocity();
  trigger.enable();
  ScrollTrigger.refresh();
}

new MutationObserver(() => {
  if (loader.style.display === 'none') unlock();
  else if (live) lock();
}).observe(loader, { attributes: true, attributeFilter: ['style'] });

function updatePointer(event) {
  if (!live) return;
  inside = true;
  const now = performance.now();
  const dt = Math.max(8, Math.min(80, now - previousPointerTime));
  const nextX = event.clientX;
  const nextY = event.clientY;
  targetVX = (nextX - previousPointerX) / dt;
  targetVY = (nextY - previousPointerY) / dt;
  previousPointerX = nextX;
  previousPointerY = nextY;
  previousPointerTime = now;
  targetX = nextX;
  targetY = nextY;
}

hero.addEventListener('pointerenter', event => {
  if (!live) return;
  targetX = event.clientX;
  targetY = event.clientY;
  lensX = targetX;
  lensY = targetY;
  resetPointerVelocity(targetX, targetY);
  inside = true;
});

hero.addEventListener('pointermove', updatePointer);
hero.addEventListener('pointerleave', () => { inside = false; });
hero.addEventListener('pointerdown', event => {
  if (!coarse || !live) return;
  targetX = event.clientX;
  targetY = event.clientY;
  inside = true;
  resetPointerVelocity(targetX, targetY);
});

function frame(now) {
  const delta = Math.max(0, Math.min(64, now - lastFrame));
  lastFrame = now;
  if (coarse && live && !reduced) {
    const autoX = width * (.5 + .23 * Math.sin(now * .00022));
    const autoY = height * (.46 + .13 * Math.cos(now * .00029));
    targetVX = (autoX - targetX) / Math.max(delta, 1);
    targetVY = (autoY - targetY) / Math.max(delta, 1);
    targetX = autoX;
    targetY = autoY;
  }

  const velocityBlend = 1 - Math.exp(-delta / 82);
  pointerVX = mix(pointerVX, targetVX, velocityBlend);
  pointerVY = mix(pointerVY, targetVY, velocityBlend);
  const velocityDecay = Math.exp(-delta / 175);
  targetVX *= velocityDecay;
  targetVY *= velocityDecay;

  const rawSpeed = Math.hypot(pointerVX, pointerVY);
  const speed = reduced ? 0 : clamp(rawSpeed / 1.85);

  const canRender = !document.hidden && pageFocused;

  if (live) {
    // Critically damped following: acceleration builds, then settles without overshoot.
    const dt = delta / 1000;
    if (reduced) { pageTravel = state.exit; pageVelocity = 0; }
    else {
      const omega = 6.5;
      const offset = pageTravel - state.exit;
      const impulse = pageVelocity + omega * offset;
      const decay = Math.exp(-omega * dt);
      pageTravel = state.exit + (offset + impulse * dt) * decay;
      pageVelocity = (pageVelocity - omega * impulse * dt) * decay;
      if (Math.abs(pageTravel - state.exit) < .0001 && Math.abs(pageVelocity) < .001) {
        pageTravel = state.exit; pageVelocity = 0;
      }
    }
    setPageY((1 - clamp(pageTravel)) * 100);
    const growing = state.growth > .001;
    const visible = inside || coarse || growing;
    visibility = mix(visibility, visible ? 1 : 0, 1 - Math.exp(-delta / 115));

    const lensBlend = 1 - Math.exp(-delta / 118);
    lensX = mix(lensX, growing ? width / 2 : targetX, lensBlend);
    lensY = mix(lensY, growing ? height / 2 : targetY, lensBlend);

    const baseRadius = coarse ? Math.min(78, width * .18) : Math.min(145, width * .09, height * .16);
    const radius = mix(baseRadius, Math.hypot(width, height) * .56, state.growth) * visibility;
    const lensOpacity = visibility;
    const glassStrength = 1 - clamp((state.growth - .58) / .42) * .72;

    hero.style.setProperty('--lx', `${lensX}px`);
    hero.style.setProperty('--ly', `${lensY}px`);
    hero.style.setProperty('--radius', `${Math.max(1, radius)}px`);

    hero.style.setProperty('--lens-opacity', String(canRender ? lensOpacity : 0));
    hero.style.setProperty('--glass-strength', String(glassStrength));
    hero.style.setProperty('--lens-speed', String(speed));
    hero.style.setProperty('--lens-growth', String(state.growth));

    nav.classList.toggle('work-visible', pageTravel > .96);
    const surface = pageTravel > .5 ? 'light' : 'dark';
    if (document.documentElement.dataset.menuSurface !== surface) document.documentElement.dataset.menuSurface = surface;
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  const xRatio = targetX / Math.max(width, 1);
  const yRatio = targetY / Math.max(height, 1);
  width = innerWidth;
  height = innerHeight;
  targetX = xRatio * width;
  targetY = yRatio * height;
  lensX = targetX;
  lensY = targetY;
  ScrollTrigger.refresh();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) lastFrame = performance.now();
});
addEventListener('focus', () => {
  pageFocused = true;
  lastFrame = performance.now();
});
addEventListener('blur', () => { pageFocused = false; });
