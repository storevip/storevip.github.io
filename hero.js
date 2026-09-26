import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector('.hero-home');
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

const state = { growth: 0, departure: 0 };
const timeline = gsap.timeline({ paused: true });
timeline.to({}, { duration: 1 });
timeline.to(state, { departure: 1, duration: .12, ease: 'power1.out' }, .02);
timeline.to('.hero-shape-waves-mount', { yPercent: 12, duration: .64, ease: 'power2.inOut' }, .02);
['one', 'two', 'three', 'four'].forEach((line, index) => {
  timeline.to(`.english-layer .line-${line}, .chinese-layer .line-${line}`, {
    y: () => -innerHeight * .12, duration: .78, ease: 'power2.inOut'
  }, .04 + index * .055);
});

const trigger = ScrollTrigger.create({
  trigger: journey,
  start: 'top top',
  end: 'bottom top',
  animation: timeline,
  scrub: reduced ? true : .85,
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
  document.querySelector('.opening-sequence').style.transform = '';

  hero.style.setProperty('--radius', '1px');
  hero.style.setProperty('--lens-opacity', '0');
  hero.style.setProperty('--glass-strength', '1');
  hero.style.setProperty('--lens-speed', '0');
  hero.style.setProperty('--lens-growth', '0');
  hero.style.setProperty('--lens-departure', '0');
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
  const nextY = event.clientY - hero.getBoundingClientRect().top;
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
  targetY = event.clientY - hero.getBoundingClientRect().top;
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
  targetY = event.clientY - hero.getBoundingClientRect().top;
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

  const canRender = !document.hidden && (coarse || pageFocused);

  if (live) {
    // Continuous slower travel: no pinned/stopped phase, no gap at the hero/banner seam.
    const opening = document.querySelector('.opening-sequence');
    opening.style.transform = `translate3d(0,${reduced ? 0 : Math.min(window.scrollY, opening.offsetHeight / .82) * .18}px,0)`;
    const growing = state.growth > .001;
    const visible = (inside || coarse) && hero.getBoundingClientRect().bottom > 0;
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
    hero.style.setProperty('--lens-departure', String(state.departure));

    const bannerRect = document.querySelector('.statement-stage').getBoundingClientRect();
    const workRect = document.querySelector('#selectedWork').getBoundingClientRect();
    const aboutRect = document.querySelector('#about').getBoundingClientRect();
    const surface = ((bannerRect.top < height * .5 && bannerRect.bottom > height * .5)) ? 'light' : 'dark';
    nav.classList.toggle('work-visible', (bannerRect.top < 60 && bannerRect.bottom > 60));
    if (document.documentElement.dataset.menuSurface !== surface) document.documentElement.dataset.menuSurface = surface;
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  if (coarse && Math.abs(innerWidth - width) < 3) return;
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

// Smooth the opening's vertical travel without coupling the horizontal marquee to input.
let scrollTarget = window.scrollY;
let scrollFrame = 0;
let scrollTime = 0;
function settleOpeningScroll(now) {
  const dt = Math.min(48, now - scrollTime || 16);
  scrollTime = now;
  if (!live || document.querySelector('#app').inert || document.querySelector('.brand-section').getBoundingClientRect().bottom <= 0) { scrollFrame = 0; scrollTarget = window.scrollY; return; }
  const before = window.scrollY;
  if (Math.abs(scrollTarget - before) <= 2) { window.scrollTo(0, scrollTarget); scrollFrame = 0; return; }
  const next = mix(window.scrollY, scrollTarget, 1 - Math.exp(-dt / 180));
  window.scrollTo(0, Math.abs(scrollTarget - next) < .8 ? scrollTarget : next);
  // Some browsers round scroll positions: stop if the remaining eased step cannot move.
  if (Math.abs(window.scrollY - before) < .1) { window.scrollTo(0, scrollTarget); scrollFrame = 0; return; }
  scrollFrame = Math.abs(scrollTarget - window.scrollY) > 2 ? requestAnimationFrame(settleOpeningScroll) : 0;
}
window.addEventListener('wheel', event => {
  const brandSection = document.querySelector('.brand-section');
  if (!live || reduced || event.ctrlKey || event.defaultPrevented || document.querySelector('#app').inert ) return;
  if (brandSection.getBoundingClientRect().bottom <= 0) {
    cancelAnimationFrame(scrollFrame); scrollFrame = 0; scrollTarget = window.scrollY;
    return;
  }
  event.preventDefault();
  if (!scrollFrame) { scrollTarget = window.scrollY; scrollTime = performance.now(); }
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  scrollTarget = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, scrollTarget + delta));
  if (!scrollFrame) scrollFrame = requestAnimationFrame(settleOpeningScroll);
}, { passive: false });

// Reference uses masked character entrances, with slower staggering for Posters.
for (const heading of document.querySelectorAll('#selectedWork h2, #about .portfolio-heading h2, .contact-title .reveal-word')) {
  const text = heading.textContent;
  heading.setAttribute('aria-label', text);
  heading.innerHTML = [...text].map(char => `<span class="reveal-character" aria-hidden="true">${char}</span>`).join('');
  if (!reduced) gsap.fromTo(heading.children, { yPercent: 120 }, {
    yPercent: 0, duration: .8, stagger: heading.closest('#selectedWork') ? .2 : .05,
    ease: 'power3.out', scrollTrigger: { trigger: heading, start: 'top 78%', toggleActions: 'play none none reverse' }
  });
}
if (!reduced) {
  gsap.utils.toArray('.poster-column').forEach((column, index) => {
    const travel = () => Math.max(0, column.scrollHeight - document.querySelector('.poster-window').clientHeight);
    gsap.fromTo(column, { y: () => index === 1 ? -travel() : 0 }, {
      y: () => index === 1 ? 0 : -travel(), ease: 'none',
      scrollTrigger: { trigger: '.poster-journey', start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true }
    });
  });
  gsap.fromTo('.contact-info > div', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.contact-info', start: 'top 88%', toggleActions: 'play none none reverse' } });
}
