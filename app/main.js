// ═══════════════════════════════════════════════════════════════════════════
// MODE STATE
// ═══════════════════════════════════════════════════════════════════════════
let currentMode = 'platform'; // 'platform' | 'moments'

// ─── Lens definitions ───────────────────────────────────────────────────
const LENSES = {
  meta:    { name: 'Meta',    dauStr: '3.58B', dau: 3.58e9, arpu: 0.154, min: 45 },
  tiktok:  { name: 'TikTok', dauStr: '1.5B',  dau: 1.5e9,  arpu: 0.035, min: 95 },
  youtube: { name: 'YouTube', dauStr: '2.7B',  dau: 2.7e9,  arpu: 0.037, min: 40 },
  google:  { name: 'Google',  dauStr: '4.0B',  dau: 4.0e9,  arpu: 0.136, min: 15 },
};

function ratePerSec(lens) {
  return lens.arpu / (lens.min * 60);
}

// ─── Formatting ─────────────────────────────────────────────────────────
function fmtSession(n) {
  return '$' + n.toFixed(4);
}

function fmtScaled(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(2);
}

function fmtTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function fmtMoments(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(2);
}

// ─── Time of day note ───────────────────────────────────────────────────
function getTimeOfDayNote() {
  const now     = new Date();
  const hour    = now.getHours();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (hour >= 0  && hour < 5)  return `${timeStr}. The rate doesn't change.`;
  if (hour >= 21)              return `${timeStr}. Late. The rate doesn't change.`;
  return null;
}

// ─── Platform state ─────────────────────────────────────────────────────
let selectedLensKey = 'meta';
let elapsedSeconds  = 0;
let sessionValue    = 0;
let lastTick        = performance.now();

// ─── localStorage ───────────────────────────────────────────────────────
const STORAGE_KEY = 'ya_lifetime_value';
let lifetimeValue = parseFloat(localStorage.getItem(STORAGE_KEY) || '0');

const lifetimeEntry   = document.getElementById('lifetime-entry');
const lifetimeDisplay = document.getElementById('lifetime-display');

if (lifetimeValue > 0) {
  lifetimeEntry.style.display = 'block';
  lifetimeDisplay.textContent = fmtSession(lifetimeValue);
}

// ─── Microcopy setup ────────────────────────────────────────────────────
const timeNote   = getTimeOfDayNote();
const timeNoteEl = document.getElementById('note-time');
if (timeNote) timeNoteEl.textContent = timeNote;

const NOTES = [
  { id: 'note-time', threshold: 8,   conditional: true },
  { id: 'note-15',   threshold: 15  },
  { id: 'note-60',   threshold: 60  },
  { id: 'note-180',  threshold: 180 },
];

// ─── Platform DOM refs ──────────────────────────────────────────────────
const ledgerValueEl    = document.getElementById('ledger-value');
const scaleAmountEl    = document.getElementById('scale-amount');
const scaleLabelEl     = document.getElementById('scale-label');
const platformTimerEl  = document.getElementById('platform-timer');
const platformLensEl   = document.getElementById('platform-lens-name');
const leaveHoverEl     = document.getElementById('leave-hover-text');
const leaveLinkEl      = document.getElementById('leave-link');

// ─── Platform animation loop ────────────────────────────────────────────
function tick(now) {
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  const lens = LENSES[selectedLensKey];
  const rate = ratePerSec(lens);

  elapsedSeconds += delta;
  sessionValue   += delta * rate;

  ledgerValueEl.textContent  = fmtSession(sessionValue);
  platformTimerEl.textContent = fmtTimer(elapsedSeconds);

  const scaled = sessionValue * lens.dau;
  scaleAmountEl.textContent = fmtScaled(scaled);
  scaleLabelEl.textContent  = `× ${lens.dauStr} daily ${lens.name} users`;

  // Microcopy reveals
  NOTES.forEach(({ id, threshold, conditional }) => {
    if (elapsedSeconds >= threshold) {
      const el = document.getElementById(id);
      if (!el || el.classList.contains('visible')) return;
      if (conditional && !el.textContent.trim()) return;
      el.classList.add('visible');
    }
  });

  if (lifetimeValue > 0) {
    lifetimeDisplay.textContent = fmtSession(lifetimeValue + sessionValue);
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ─── Lens switching ─────────────────────────────────────────────────────
const platformBottomEl = document.getElementById('platform-bottom');

platformBottomEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lens]');
  if (!btn) return;
  selectedLensKey = btn.dataset.lens;
  platformBottomEl.querySelectorAll('.chiclet').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  platformLensEl.textContent = LENSES[selectedLensKey].name;
});

// ─── About ──────────────────────────────────────────────────────────────
const aboutOverlay = document.getElementById('about-overlay');
document.getElementById('about-btn').addEventListener('click', () => {
  aboutOverlay.classList.add('open');
});
document.getElementById('about-close').addEventListener('click', () => {
  aboutOverlay.classList.remove('open');
});
aboutOverlay.addEventListener('click', (e) => {
  if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
});

// ─── Leave hover ────────────────────────────────────────────────────────
let hoverTimer = null;
leaveLinkEl.addEventListener('mouseenter', () => {
  hoverTimer = setTimeout(() => leaveHoverEl.classList.add('visible'), 1000);
});
leaveLinkEl.addEventListener('mouseleave', () => {
  clearTimeout(hoverTimer);
  leaveHoverEl.classList.remove('visible');
});

// ─── Animated favicon eye ───────────────────────────────────────────────
const eyeIris  = document.getElementById('eye-iris');
const eyePupil = document.getElementById('eye-pupil');

const EYE_CENTER = 32;
const EYE_RANGE  = 8;

let eyeTargetX  = EYE_CENTER;
let eyeTargetY  = EYE_CENTER;
let eyeCurrentX = EYE_CENTER;
let eyeCurrentY = EYE_CENTER;
let faviconFrame = 0;

document.addEventListener('mousemove', (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  eyeTargetX = EYE_CENTER + dx * EYE_RANGE;
  eyeTargetY = EYE_CENTER + dy * EYE_RANGE;
});

function scheduleAutonomousGlance() {
  setTimeout(() => {
    const angle = Math.random() * Math.PI * 2;
    eyeTargetX = EYE_CENTER + Math.cos(angle) * EYE_RANGE;
    eyeTargetY = EYE_CENTER + Math.sin(angle) * EYE_RANGE;
    scheduleAutonomousGlance();
  }, 5000 + Math.random() * 5000);
}
scheduleAutonomousGlance();

function updateFavicon() {
  const svg    = document.getElementById('eye-svg');
  const source = new XMLSerializer().serializeToString(svg);
  const url    = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

const BLINK_RY = [13, 9, 4, 1, 1, 4, 9, 13];
let isBlinking = false;

function blink() {
  if (isBlinking) return;
  isBlinking = true;
  let frame = 0;
  function step() {
    if (frame >= BLINK_RY.length) { isBlinking = false; scheduleBlink(); return; }
    const ry = BLINK_RY[frame];
    eyeIris.setAttribute('ry', ry);
    eyePupil.setAttribute('ry', Math.max(1, Math.round(ry * 6 / 13)));
    frame++;
    setTimeout(step, 18);
  }
  step();
}

function scheduleBlink() {
  setTimeout(blink, 3000 + Math.random() * 5000);
}
scheduleBlink();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const angle = Math.random() * Math.PI * 2;
    eyeCurrentX = EYE_CENTER + Math.cos(angle) * EYE_RANGE;
    eyeCurrentY = EYE_CENTER + Math.sin(angle) * EYE_RANGE;
  }
});

function animateEye() {
  eyeCurrentX += (eyeTargetX - eyeCurrentX) * 0.12;
  eyeCurrentY += (eyeTargetY - eyeCurrentY) * 0.12;
  eyeIris.setAttribute('cx', eyeCurrentX);
  eyeIris.setAttribute('cy', eyeCurrentY);
  eyePupil.setAttribute('cx', eyeCurrentX);
  eyePupil.setAttribute('cy', eyeCurrentY);
  faviconFrame++;
  if (faviconFrame % 3 === 0) updateFavicon();
  requestAnimationFrame(animateEye);
}
animateEye();

// ─── Persist to localStorage ────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  localStorage.setItem(STORAGE_KEY, (lifetimeValue + sessionValue).toString());
});
setInterval(() => {
  localStorage.setItem(STORAGE_KEY, (lifetimeValue + sessionValue).toString());
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// MOMENTS MODE
// ═══════════════════════════════════════════════════════════════════════════

const MOMENTS = {
  // ── Sports Spectacles ──
  superbowl: {
    name: 'Super Bowl',
    cat: 'sports',
    audience: '125 million watched',
    rate: 267000,
    flavor: 'The only event where people watch the ads on purpose.',
    context: '$8M per 30-second spot.',
    source: 'Super Bowl LX (2026). Nielsen, NBC.',
    link: 'https://en.wikipedia.org/wiki/Super_Bowl',
  },
  worldcup: {
    name: 'World Cup Final',
    cat: 'sports',
    audience: '1.5 billion watched',
    rate: 1500000,
    flavor: 'The single largest simultaneous audience on Earth.',
    context: 'Every broadcast surface on the planet.',
    source: 'FIFA 2022 final. 2026 projections.',
    link: 'https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final',
  },
  nbafinals: {
    name: 'NBA Finals',
    cat: 'sports',
    audience: '19.6 million watched',
    rate: 18000,
    flavor: 'The per-second value of Game 7 dwarfs Game 1.',
    context: '$288M in ad revenue across the series.',
    source: '2025 NBA Finals. Sportico.',
    link: 'https://en.wikipedia.org/wiki/NBA_Finals',
  },
  stanleycup: {
    name: 'Stanley Cup',
    cat: 'sports',
    audience: '4.8 million watched',
    rate: 8000,
    flavor: 'Smaller audience. Wealthier audience. The math still works.',
    context: 'Hockey audience skews wealthy — the CPM reflects it.',
    source: '2025 Stanley Cup Finals.',
    link: 'https://en.wikipedia.org/wiki/Stanley_Cup_Finals',
  },

  // ── Cultural Ceremonies ──
  oscars: {
    name: 'The Oscars',
    cat: 'culture',
    audience: '17.9 million watched',
    rate: 66667,
    flavor: 'The ceremony is the seed. The real harvest comes after.',
    context: '$2M per 30-second spot.',
    source: '98th Academy Awards (2026). Variety.',
    link: 'https://en.wikipedia.org/wiki/Academy_Awards',
  },
  grammys: {
    name: 'The Grammys',
    cat: 'culture',
    audience: '14.4 million watched',
    rate: 30000,
    flavor: 'A single performance can generate millions of streams overnight.',
    context: '302.5 million video views.',
    source: '68th Grammy Awards (2026). CBS.',
    link: 'https://en.wikipedia.org/wiki/Grammy_Awards',
  },

  // ── Political Inflection Points ──
  electionnight: {
    name: 'Election Night',
    cat: 'political',
    audience: '42.3 million tuned in',
    rate: 50000,
    flavor: 'Nobody is being entertained. They\'re watching because they have to know.',
    context: '18 networks simultaneously.',
    source: '2024 Presidential Election. Nielsen.',
    link: 'https://en.wikipedia.org/wiki/2024_United_States_presidential_election',
  },
  stateofunion: {
    name: 'State of the Union',
    cat: 'political',
    audience: '36.6 million tuned in',
    rate: 30000,
    flavor: 'One of the only remaining appointment-TV political events.',
    context: 'Every major network, simultaneously.',
    source: '2025 Joint Address. Nielsen.',
    link: 'https://en.wikipedia.org/wiki/State_of_the_Union',
  },

  // ── Digital-Native Moments ──
  kaicenat: {
    name: 'Kai Cenat',
    cat: 'digital',
    audience: '1 million concurrent',
    rate: 7.72,
    subtitle: 'Twitch streamer. Broadcast live for 30 days straight.',
    flavor: 'One person generating Super Bowl-adjacent revenue from a living room.',
    context: '~$20M in 30 days. No broadcast network.',
    source: 'Mafiathon 3 (2025). Streams Charts.',
    link: 'https://en.wikipedia.org/wiki/Kai_Cenat',
  },
  lolworlds: {
    name: 'LoL Worlds',
    cat: 'digital',
    audience: '50 million watched',
    rate: 14000,
    subtitle: 'League of Legends championship. The biggest esports event.',
    flavor: 'Most of this audience is invisible to traditional media.',
    context: 'Audience primarily under 30.',
    source: 'Worlds 2024 Final. Esports Charts.',
    link: 'https://en.wikipedia.org/wiki/League_of_Legends_World_Championship',
  },
  mrbeast: {
    name: 'MrBeast',
    cat: 'digital',
    audience: '33–52 million views',
    rate: 3333,
    subtitle: 'YouTube creator. Most-subscribed individual on Earth.',
    flavor: 'Per-second attention value that rivals network television. One creator.',
    context: '~$3M per 15-minute video.',
    source: 'MrBeast (2025). Social Blade.',
    link: 'https://en.wikipedia.org/wiki/MrBeast',
  },
  joerogan: {
    name: 'Joe Rogan',
    cat: 'digital',
    audience: '11 million per episode',
    rate: 11.57,
    subtitle: 'Podcast. #1 on Spotify for six years running.',
    flavor: 'No visual real estate to sell. Monetizes at scale anyway.',
    context: '#1 on Spotify, Apple, and YouTube.',
    source: 'JRE (2025). Hollywood Reporter.',
    link: 'https://en.wikipedia.org/wiki/The_Joe_Rogan_Experience',
  },
  squidgame: {
    name: 'Netflix Premiere',
    cat: 'digital',
    audience: '68 million households',
    rate: 39,
    subtitle: 'Squid Game S2. Streaming has no ads — attention is retention.',
    flavor: 'The value is invisible. It exists as retention, not revenue.',
    context: '487.6M hours. #1 in 92 countries. Zero ad dollars.',
    source: 'Squid Game S2 (2024). Variety.',
    link: 'https://en.wikipedia.org/wiki/Squid_Game_(TV_series)',
  },
  primeday: {
    name: 'Prime Day',
    cat: 'digital',
    audience: '200+ million shopped',
    rate: 69791,
    subtitle: 'Amazon\'s manufactured shopping event. Attention as transaction.',
    flavor: 'No entertainment. No content. Pure commercial attention.',
    context: '$24.1 billion in 4 days.',
    source: 'Prime Day 2025. CNBC.',
    link: 'https://en.wikipedia.org/wiki/Amazon_Prime_Day',
  },
};

// ─── Moments state ──────────────────────────────────────────────────────
let selectedCat       = 'sports';
let selectedEventKey  = 'superbowl';
let momentsElapsed    = 0;
let momentsValue      = 0;
let momentsLastTick   = performance.now();
let momentsFlavorShown = false;

// ─── Moments DOM refs ───────────────────────────────────────────────────
const platformModeEl    = document.getElementById('platform-mode');
const momentsModeEl     = document.getElementById('moments-mode');
const momentsValueEl    = document.getElementById('moments-value');
const momentsTimerEl    = document.getElementById('moments-timer');
const momentsAudienceEl = document.getElementById('moments-audience');
const momentsContextEl  = document.getElementById('moments-context');
const momentsFlavorEl   = document.getElementById('moments-note-flavor');
const momentsEventsEl   = document.getElementById('moments-events');
const momentsBottomEl   = document.getElementById('moments-bottom');
const modeToggleEl      = document.getElementById('mode-toggle');

// ─── Render event chiclets for a category ───────────────────────────────
function renderCategoryEvents(cat) {
  momentsEventsEl.innerHTML = '';
  Object.entries(MOMENTS)
    .filter(([, v]) => v.cat === cat)
    .forEach(([key, evt]) => {
      const btn = document.createElement('button');
      btn.className = 'chiclet' + (key === selectedEventKey ? ' active' : '');
      btn.dataset.event = key;
      btn.textContent = evt.name;
      momentsEventsEl.appendChild(btn);
    });
}

// ─── Select an event ────────────────────────────────────────────────────
function selectEvent(key) {
  selectedEventKey  = key;
  momentsElapsed    = 0;
  momentsValue      = 0;
  momentsLastTick   = performance.now();
  momentsFlavorShown = false;
  momentsFlavorEl.classList.remove('visible');

  const evt = MOMENTS[key];
  momentsAudienceEl.textContent = evt.audience;
  momentsFlavorEl.textContent   = evt.flavor;
  momentsValueEl.textContent    = '$0';
  momentsTimerEl.textContent    = '0:00';

  // Build context: subtitle (if present) + context line + link
  let html = '';
  if (evt.subtitle) {
    html += '<span class="context-subtitle">' + evt.subtitle + '</span>';
  }
  html += '<span class="context-detail">' + evt.context;
  if (evt.link) {
    html += ' <a href="' + evt.link + '" target="_blank" rel="noopener" class="context-link" title="Learn more">↗</a>';
  }
  html += '</span>';
  momentsContextEl.innerHTML = html;

  // Update active chiclet
  momentsEventsEl.querySelectorAll('.chiclet').forEach(b => {
    b.classList.toggle('active', b.dataset.event === key);
  });
}

// ─── Moments animation loop ─────────────────────────────────────────────
function momentsTick(now) {
  if (currentMode !== 'moments') {
    requestAnimationFrame(momentsTick);
    return;
  }

  const delta = (now - momentsLastTick) / 1000;
  momentsLastTick = now;

  const evt = MOMENTS[selectedEventKey];
  momentsElapsed += delta;
  momentsValue   += delta * evt.rate;

  momentsValueEl.textContent = fmtMoments(momentsValue);
  momentsTimerEl.textContent = fmtTimer(momentsElapsed);

  if (momentsElapsed >= 5 && !momentsFlavorShown) {
    momentsFlavorEl.classList.add('visible');
    momentsFlavorShown = true;
  }

  requestAnimationFrame(momentsTick);
}
requestAnimationFrame(momentsTick);

// ─── Category switching ─────────────────────────────────────────────────
document.getElementById('moments-categories').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-tab');
  if (!btn) return;
  selectedCat = btn.dataset.cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const firstKey = Object.keys(MOMENTS).find(k => MOMENTS[k].cat === selectedCat);
  renderCategoryEvents(selectedCat);
  selectEvent(firstKey);
});

// ─── Event switching ────────────────────────────────────────────────────
momentsEventsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chiclet');
  if (!btn) return;
  selectEvent(btn.dataset.event);
});

// ─── Mode switching ─────────────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;

  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  if (mode === 'platform') {
    platformModeEl.style.display  = '';
    momentsModeEl.style.display   = 'none';
    platformBottomEl.style.display = '';
    momentsBottomEl.style.display  = 'none';
    lifetimeEntry.style.display    = lifetimeValue > 0 ? 'block' : 'none';
    document.getElementById('about-platform').style.display = '';
    document.getElementById('about-moments').style.display  = 'none';
  } else {
    platformModeEl.style.display  = 'none';
    momentsModeEl.style.display   = '';
    platformBottomEl.style.display = 'none';
    momentsBottomEl.style.display  = '';
    lifetimeEntry.style.display    = 'none';
    document.getElementById('about-platform').style.display = 'none';
    document.getElementById('about-moments').style.display  = '';

    // Reset counter
    momentsLastTick   = performance.now();
    momentsElapsed    = 0;
    momentsValue      = 0;
    momentsFlavorShown = false;
    momentsFlavorEl.classList.remove('visible');

    renderCategoryEvents(selectedCat);
    selectEvent(selectedEventKey);
  }
}

modeToggleEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;
  switchMode(btn.dataset.mode);
});

// ─── Initialize ─────────────────────────────────────────────────────────
renderCategoryEvents(selectedCat);
selectEvent(selectedEventKey);
