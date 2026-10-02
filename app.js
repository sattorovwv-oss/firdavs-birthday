(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    document.documentElement.classList.add('js-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let particles = [], frame = 0, previous = 0;
  const colors = ['#ffc78e', '#f8e9bc', '#8da1ff', '#d9dfb1', '#e18eaa'];
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio; canvas.height = window.innerHeight * ratio;
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize(); window.addEventListener('resize', resize, { passive: true });
  function animate(time) {
    const step = Math.min((time - previous) / 16.67 || 1, 2); previous = time;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter(p => p.life > 0 && p.y < window.innerHeight + 50);
    particles.forEach(p => {
      p.x += p.vx * step; p.y += p.vy * step; p.vy += .07 * step; p.vx *= .997;
      p.rotation += p.spin * step; p.life -= step;
      ctx.save(); ctx.globalAlpha = Math.min(p.life / 35, 1); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore();
    });
    if (particles.length) frame = requestAnimationFrame(animate);
    else { frame = 0; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
  function celebrate(amount = 140) {
    if (reduceMotion || !ctx) return;
    for (let i = 0; i < amount; i++) particles.push({ x: Math.random() * window.innerWidth, y: -20 - Math.random() * 220, vx: (Math.random() - .5) * 6, vy: 2 + Math.random() * 3, spin: (Math.random() - .5) * .13, rotation: Math.random() * Math.PI, size: 5 + Math.random() * 7, life: 230 + Math.random() * 100, color: colors[Math.floor(Math.random() * colors.length)] });
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(animate); }
  }
  document.getElementById('open-greeting').addEventListener('click', () => celebrate(65));
  const celebrateButton = document.getElementById('celebrate');
  celebrateButton.addEventListener('click', () => {
    document.getElementById('final-message').textContent = 'С днём рождения, брат. Всё лучшее — впереди!';
    celebrateButton.firstChild.textContent = 'Ещё немного праздника! ';
    celebrate(160);
  });

  document.querySelectorAll('.wish-card').forEach(card => card.addEventListener('click', () => {
    const expanded = card.getAttribute('aria-expanded') !== 'true';
    card.setAttribute('aria-expanded', String(expanded));
    card.querySelector('.wish-hint').firstChild.textContent = expanded ? 'Для тебя ' : 'Открыть пожелание ';
    card.querySelector('.wish-hint > span').textContent = expanded ? '−' : '+';
  }));

  const dialog = document.getElementById('photo-dialog');
  const photoButton = document.getElementById('open-photo');
  photoButton.addEventListener('click', () => { dialog.showModal(); document.body.style.overflow = 'hidden'; });
  document.getElementById('close-photo').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; photoButton.focus({ preventScroll: true }); });

  // A quiet original instrumental, synthesized locally after a visitor's tap.
  const musicButton = document.getElementById('music');
  const musicLabel = document.getElementById('music-label');
  let audio = null, master = null, playing = false, musicTimer = null, noteIndex = 0;
  const melody = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23, 440, 587.33, 440, 349.23, 220, 261.63, 329.63, 440, 329.63, 261.63, 196, 246.94, 293.66, 392, 293.66, 246.94];
  function note(frequency, time, duration, volume) {
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(gain); gain.connect(master); osc.start(time); osc.stop(time + duration + .05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  function musicStep() {
    if (!playing) return;
    const time = audio.currentTime + .02;
    note(melody[noteIndex % melody.length], time, 2.8, .13);
    if (noteIndex % 6 === 0) note(melody[noteIndex % melody.length] / 2, time, 4, .09);
    noteIndex++; musicTimer = window.setTimeout(musicStep, 640);
  }
  musicButton.addEventListener('click', async () => {
    musicButton.disabled = true;
    try {
      if (!audio) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio unavailable');
        audio = new Audio(); master = audio.createGain(); master.gain.value = 0; master.connect(audio.destination);
      }
      if (audio.state === 'suspended') await audio.resume();
      playing = !playing; master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(playing ? .3 : 0, audio.currentTime, .2);
      if (playing) musicStep(); else window.clearTimeout(musicTimer);
      musicButton.setAttribute('aria-pressed', String(playing));
      musicButton.setAttribute('aria-label', playing ? 'Выключить тихую музыку' : 'Включить тихую музыку');
      musicButton.classList.toggle('playing', playing); musicLabel.textContent = playing ? 'Звучит' : 'Музыка';
    } catch { musicLabel.textContent = 'Без музыки'; musicButton.setAttribute('aria-label', 'Музыка недоступна в этом браузере'); }
    finally { musicButton.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (!audio || !playing) return;
    if (document.hidden) { window.clearTimeout(musicTimer); master.gain.setTargetAtTime(0, audio.currentTime, .15); }
    else { master.gain.setTargetAtTime(.3, audio.currentTime, .2); musicStep(); }
  });
})();
