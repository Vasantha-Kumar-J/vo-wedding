/* All dates use explicit IST. No account, cookies, storage, or backend required. */
(() => {
  'use strict';
  const opening = document.getElementById('opening');
  const main = document.getElementById('invitation');
  const video = document.getElementById('envelopeVideo');
  const music = document.getElementById('music');
  const musicButton = document.getElementById('musicToggle');
  const musicLabel = document.getElementById('musicLabel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false;
  let started = false;
  let revealTimer;
  let observer;
  let finishTimer;
  let greetingHeld = false;
  const GREETING_HOLD_MS = 1000;
  const PAGE_FADE_MS = 1200;
  const flowerRain = document.getElementById('flowerRain');
  const petals = [3,96,9,89,16,82,5,93,12,87];
  petals.forEach((left, index) => {
    const flower = document.createElement('span');
    flower.className = 'flower-fall';
    flower.style.cssText = `--left:${left}%;--size:${18 + (index % 3) * 4}px;--duration:${22 + (index % 4) * 3}s;--delay:${-index * 3.7}s;--drift:${index % 2 ? -18 : 18}px`;
    const image = document.createElement('img');
    image.src = 'assets/images/blossom.webp'; image.alt = ''; image.width = 96; image.height = 96;
    flower.appendChild(image); flowerRain.appendChild(flower);
  });
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-inactive', document.hidden));

  function syncMusic() {
    const playing = !music.paused;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicLabel.textContent = playing ? 'Music on' : 'Music off';
  }
  async function playMusic() {
    music.volume = 0.35;
    try { await music.play(); } catch { /* Sound is optional; the invitation always opens. */ }
    syncMusic();
  }
  musicButton.addEventListener('click', () => music.paused ? playMusic() : music.pause());
  music.addEventListener('play', syncMusic);
  music.addEventListener('pause', syncMusic);
  music.addEventListener('error', syncMusic);

  function showInvitation() {
    if (opened) return;
    opened = true;
    clearTimeout(revealTimer);
    main.inert = false;
    main.removeAttribute('aria-hidden');
    document.body.classList.add('invitation-revealing', 'has-entered');
    musicButton.hidden = false;
    opening.classList.add('is-leaving');
    opening.inert = true;
    main.focus({ preventScroll: true });
    opening.setAttribute('aria-hidden', 'true');
    const finishReveal = () => {
      opening.hidden = true; video.pause();
      document.body.classList.remove('opening-active');
      // Keep entry classes until the last gently staggered heading has settled.
      setTimeout(() => document.body.classList.remove('invitation-revealing'), 500);
    };
    finishTimer = setTimeout(finishReveal, reducedMotion.matches ? 0 : PAGE_FADE_MS);
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.08 });
      document.querySelectorAll('.reveal').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
    }
  }
  function openEnvelope() {
    if (started) return;
    started = true;
    playMusic();
    opening.classList.add('is-opening');
    document.getElementById('openText').disabled = true;
    opening.focus({ preventScroll: true });
    document.getElementById('openEnvelope').disabled = true;
    if (reducedMotion.matches) { showInvitation(); return; }
    // A fixed maximum wait avoids a stalled video trapping the guest.
    revealTimer = setTimeout(showInvitation, 12000);
    try { video.play().catch(showInvitation); } catch { showInvitation(); }
  }
  document.getElementById('openEnvelope').addEventListener('click', openEnvelope);
  document.getElementById('openText').addEventListener('click', openEnvelope);

  function holdGreeting() {
    if (!started || opened || greetingHeld) return;
    greetingHeld = true;
    clearTimeout(revealTimer);
    video.pause();
    opening.classList.add('is-greeting');
    // Hold the film's actual “You’re cordially invited” card before dissolving.
    revealTimer = setTimeout(showInvitation, reducedMotion.matches ? 0 : GREETING_HOLD_MS);
  }
  video.addEventListener('timeupdate', () => {
    if (Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.1) holdGreeting();
  });
  video.addEventListener('ended', holdGreeting);
  video.addEventListener('error', () => { if (started) showInvitation(); });
  opening.addEventListener('keydown', event => {
    if (event.key === 'Escape') showInvitation();
    if (event.key !== 'Tab') return;
    const buttons = [...opening.querySelectorAll('button:not(:disabled)')];
    if (!buttons.length) { event.preventDefault(); opening.focus({ preventScroll: true }); return; }
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === opening)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const cards = [...document.querySelectorAll('.date-card')];
  function revealDate(card) {
    card.classList.add('is-revealed');
    card.setAttribute('aria-label', card.dataset.value);
    if (cards.every(item => item.classList.contains('is-revealed'))) {
      document.getElementById('dateMessage').textContent = '30 October 2026';
    }
  }
  cards.forEach(card => {
    let startX;
    card.addEventListener('click', () => revealDate(card));
    card.addEventListener('pointerdown', event => { startX = event.clientX; });
    card.addEventListener('pointerup', event => { if (startX !== undefined && Math.abs(event.clientX - startX) > 24) revealDate(card); startX = undefined; });
    card.addEventListener('pointercancel', () => { startX = undefined; });
  });

  const weddingTime = new Date('2026-10-30T05:00:00+05:30').getTime();
  function tick() {
    let total = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
    const values = [Math.floor(total / 86400), Math.floor(total % 86400 / 3600), Math.floor(total % 3600 / 60), total % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => { document.getElementById(id).textContent = String(values[index]).padStart(2, '0'); });
    if (total === 0) document.getElementById('countdownCaption').textContent = 'Our forever has begun.';
  }
  tick();
  setInterval(tick, 1000);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      observer?.disconnect();
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      if (started && !opened) showInvitation();
      if (opened) { clearTimeout(finishTimer); opening.hidden = true; video.pause(); document.body.classList.remove('opening-active', 'invitation-revealing'); }
    }
  });
  // Only enable the opening after the invitation's handlers are ready.
  if (!window.location.hash) {
    opening.hidden = false;
    main.inert = true;
    main.setAttribute('aria-hidden', 'true');
    document.body.classList.add('opening-active');
    opening.focus({ preventScroll: true });
  } else {
    opened = true;
    document.body.classList.add('has-entered');
    musicButton.hidden = false;
  }
})();
