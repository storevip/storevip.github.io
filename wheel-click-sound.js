// One context, decoded sample and gain node survive menu close/reopen.
// BufferSource nodes are single-use by Web Audio design; the sample is reused.
export function createWheelClickSound(url, volume) {
  let context, gain, buffer, loading, active;
  let disposed = false;
  let warned = false;
  let pendingUntil = 0;
  const warn = error => {
    if (import.meta.env.DEV && !warned && !disposed) {
      warned = true;
      console.warn('[NavigationWheel] Click sound unavailable:', error);
    }
  };
  function load() {
    if (loading || buffer) return;
    loading = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Audio HTTP ${response.status}: ${url}`);
        return response.arrayBuffer();
      })
      // Callback form also works in Safari versions without promise decode support.
      .then(data => new Promise((resolve, reject) => {
        if (disposed) { resolve(null); return; }
        context.decodeAudioData(data, resolve, reject);
      }))
      .then(decoded => {
        if (disposed) return;
        buffer = decoded;
        if (performance.now() < pendingUntil) play();
      })
      .catch(warn)
      .finally(() => { loading = null; });
  }
  function unlock() {
    if (disposed) return;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Web Audio is not supported');
        context = new AudioContext();
        gain = context.createGain();
        gain.gain.value = Math.min(1, Math.max(0, volume));
        gain.connect(context.destination);
      }
      // Invoke resume before any await/fetch; Safari requires a trusted gesture.
      const resumed = context.resume();
      resumed?.then(() => {
        if (!disposed && performance.now() < pendingUntil) play();
      }).catch(warn);
      const silent = context.createBufferSource();
      silent.buffer = context.createBuffer(1, 1, context.sampleRate);
      silent.connect(gain);
      silent.onended = () => silent.disconnect();
      silent.start();
      load();
    } catch (error) { warn(error); }
  }
  function play() {
    if (disposed || !context) return;
    if (!buffer) {
      // Keep at most one recent tick while preload finishes; never replay a queue.
      pendingUntil = performance.now() + 120;
      load();
      return;
    }
    if (context.state !== 'running') {
      pendingUntil = performance.now() + 120;
      context.resume().then(() => {
        if (!disposed && context.state === 'running' && performance.now() < pendingUntil) play();
      }).catch(warn);
      return;
    }
    pendingUntil = 0;
    try {
      if (active) { active.stop(); active.disconnect(); }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => {
        source.disconnect();
        if (active === source) active = null;
      };
      active = source;
      source.start();
    } catch (error) { warn(error); }
  }
  function dispose() {
    disposed = true;
    pendingUntil = 0;
    try { active?.stop(); active?.disconnect(); gain?.disconnect(); } catch (error) { warn(error); }
    context?.close().catch(warn);
    buffer = null;
  }
  return { unlock, play, dispose };
}
