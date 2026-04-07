// ═══════════════════════════════════════════════════════════════════════════
// MODE STATE
// ═══════════════════════════════════════════════════════════════════════════
let currentMode = 'platform'; // 'platform' | 'moments'

// ─── Lens definitions ───────────────────────────────────────────────────
// rate_per_second = arpu_per_day / (minutes_per_day x 60)
//
// Meta:    FY2025. Revenue $200.97B, DAP 3.58B. ARPP/day = $0.154.
// TikTok:  2024 est. ad revenue ~$18.4B (80% of ~$23B total), DAU ~1.5B, 95 min/day.
//          TikTok does not publish financials; figures from analyst estimates.
// YouTube: FY2024 ad revenue $36.15B (Alphabet AR), 2.7B MAU, 40 min/day.
// Google:  FY2024 Search & other $198.1B (Alphabet AR), ~4B daily users, 15 min/day.
//          Note: reflects all Search-adjacent revenue, not time-on-site alone.
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

// ─── Time of day note ───────────────────────────────────────────────────
// Late night and late evening only. Silence during regular hours.
function getTimeOfDayNote() {
  const now     = new Date();
  const hour    = now.getHours();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (hour >= 0  && hour < 5)  return `${timeStr}. The rate doesn't change.`;
  if (hour >= 21)              return `${timeStr}. Late. The rate doesn't change.`;
  return null;
}

// ─── State ──────────────────────────────────────────────────────────────
let selectedLensKey = 'meta';
let elapsedSeconds  = 0;
let sessionValue    = 0;
let lastTick        = performance.now();

// ─── localStorage ───────────────────────────────────────────────────────
const STORAGE_KEY = 'ya_lifetime_value';
let lifetimeValue = parseFloat(localStorage.getItem(STORAGE_KEY) || '0');

const lifetimeEntry   = document.getElementById('lifetime-entry');
const lifetimeDisplay = document.getElementById('lifetime-display');

// Show on return visits only (lifetimeValue > 0 means they've been here before)
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

// ─── DOM refs ───────────────────────────────────────────────────────────
const ledgerValueEl  = document.getElementById('ledger-value');
const scaleAmountEl  = document.getElementById('scale-amount');
const scaleLabelEl   = document.getElementById('scale-label');
const leaveHoverEl   = document.getElementById('leave-hover-text');
const leaveLinkEl    = document.getElementById('leave-link');

// ─── Animation loop ─────────────────────────────────────────────────────
function tick(now) {
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  const lens = LENSES[selectedLensKey];
  const rate = ratePerSec(lens);

  elapsedSeconds += delta;
  sessionValue   += delta * rate;

  // Primary number
  ledgerValueEl.textContent = fmtSession(sessionValue);

  // Scale: the "oh shit" confrontation — their number vs yours
  const scaled = sessionValue * lens.dau;
  scaleAmountEl.textContent = fmtScaled(scaled);
  scaleLabelEl.textContent  = `x ${lens.dauStr} ${lens.name} users right now`;

  // Microcopy reveals
  NOTES.forEach(({ id, threshold, conditional }) => {
    if (elapsedSeconds >= threshold) {
      const el = document.getElementById(id);
      if (!el || el.classList.contains('visible')) return;
      if (conditional && !el.textContent.trim()) return;
      el.classList.add('visible');
    }
  });

  // Keep lifetime display current during session (return visits only)
  if (lifetimeValue > 0) {
    lifetimeDisplay.textContent = fmtSession(lifetimeValue + sessionValue);
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// ─── Platform label — dynamic suggestion, clickable ────────────────────
const NEXT_LENS = {
  meta:    { key: 'google',  label: 'Now try Google.' },
  google:  { key: 'tiktok',  label: 'Now try TikTok.' },
  tiktok:  { key: 'meta',    label: 'Now try Meta.'   },
  youtube: { key: 'google',  label: 'Now try Google.' },
};

const platformLabelEl = document.getElementById('platform-label');

function updatePlatformLabel(lensKey) {
  const next = NEXT_LENS[lensKey];
  if (next) platformLabelEl.textContent = next.label;
}

updatePlatformLabel(selectedLensKey); // set on load

platformLabelEl.addEventListener('click', () => {
  const next = NEXT_LENS[selectedLensKey];
  if (!next) return;
  selectedLensKey = next.key;
  document.querySelectorAll('[data-lens]').forEach(b => {
    b.classList.toggle('active', b.dataset.lens === selectedLensKey);
  });
  updatePlatformLabel(selectedLensKey);
});

// ─── Lens switching (counter does not reset — rate changes forward only) ─
document.getElementById('book-selector').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lens]');
  if (!btn) return;
  selectedLensKey = btn.dataset.lens;
  document.querySelectorAll('[data-lens]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updatePlatformLabel(selectedLensKey);
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
const EYE_RANGE  = 8; // max px the iris can drift from center

let eyeTargetX  = EYE_CENTER;
let eyeTargetY  = EYE_CENTER;
let eyeCurrentX = EYE_CENTER;
let eyeCurrentY = EYE_CENTER;
let faviconFrame = 0;

// Cursor tracking — maps viewport position to eye movement range
document.addEventListener('mousemove', (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  eyeTargetX = EYE_CENTER + dx * EYE_RANGE;
  eyeTargetY = EYE_CENTER + dy * EYE_RANGE;
});

// Occasional autonomy — eye glances away every 5–10s
// Breaks the illusion that it's purely reactive
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

// ─── Blink ──────────────────────────────────────────────────────────────
// Animate iris/pupil ry through a keyframe sequence (~144ms total)
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

// ─── Tab-away behavior ───────────────────────────────────────────────────
// When you return to the tab, the eye was elsewhere while you were gone
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const angle = Math.random() * Math.PI * 2;
    eyeCurrentX = EYE_CENTER + Math.cos(angle) * EYE_RANGE;
    eyeCurrentY = EYE_CENTER + Math.sin(angle) * EYE_RANGE;
  }
});

function animateEye() {
  // Lerp toward target — 0.12 gives a slight organic lag
  eyeCurrentX += (eyeTargetX - eyeCurrentX) * 0.12;
  eyeCurrentY += (eyeTargetY - eyeCurrentY) * 0.12;

  eyeIris.setAttribute('cx', eyeCurrentX);
  eyeIris.setAttribute('cy', eyeCurrentY);
  eyePupil.setAttribute('cx', eyeCurrentX);
  eyePupil.setAttribute('cy', eyeCurrentY);

  // Throttle favicon DOM writes to every 3 frames (~50ms) for perf
  faviconFrame++;
  if (faviconFrame % 3 === 0) updateFavicon();

  requestAnimationFrame(animateEye);
}

animateEye();

// ─── Persist to localStorage ────────────────────────────────────────────
// Save on exit (may not fire reliably on mobile)
window.addEventListener('beforeunload', () => {
  localStorage.setItem(STORAGE_KEY, (lifetimeValue + sessionValue).toString());
});
// Backup: save every 30 seconds so a forced close doesn't lose the session
setInterval(() => {
  localStorage.setItem(STORAGE_KEY, (lifetimeValue + sessionValue).toString());
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// MOMENTS MODE
// ═══════════════════════════════════════════════════════════════════════════

// ─── Moments data ───────────────────────────────────────────────────────
// rate = estimated dollars flowing per second during the event
// audience = estimated simultaneous viewers
// duration_hrs = approximate broadcast/event duration
// source = short citation
//
// Calculation: total event ad revenue / (duration in seconds)
// Where exact $/sec isn't calculable, we estimate from ad rates and volume.

const MOMENTS = {
  // ── Sports Spectacles ──
  superbowl: {
    name: 'The Super Bowl',
    cat: 'sports',
    desc: 'broadcast + social + betting',
    audience: '125 million viewers',
    rate: 267000,   // ~$8M/30sec ad spots, ~50min of ads over ~4hrs
    flavor: 'The only event where people watch the ads on purpose.',
    context: '125 million Americans. $8M per 30-second spot. The attention is voluntary.',
    source: 'Super Bowl LX (2026). Nielsen, NBC ad rates.',
  },
  worldcup: {
    name: 'World Cup Final',
    cat: 'sports',
    desc: 'the whole planet',
    audience: '1.5 billion viewers',
    rate: 1500000,  // Estimated from ~$11B tournament rev, final captures disproportionate share
    flavor: 'The single largest simultaneous audience on Earth.',
    context: '1.5 billion viewers. Every broadcast surface on the planet. Nothing else comes close.',
    source: 'FIFA 2022 final (1.5B viewers). 2026 projections from FIFA/SI.',
  },
  nbafinals: {
    name: 'NBA Finals',
    cat: 'sports',
    desc: 'game 7',
    audience: '19.6 million viewers',
    rate: 18000,    // $288M series / ~7 games / ~2.5hrs
    flavor: 'The per-second value of Game 7 dwarfs Game 1.',
    context: '19.6 million viewers at peak. $288M in ad revenue across the series.',
    source: '2025 NBA Finals. NBA.com, Sportico.',
  },
  stanleycup: {
    name: 'Stanley Cup',
    cat: 'sports',
    desc: 'smaller crowd, higher CPM',
    audience: '4.8 million viewers',
    rate: 8000,     // ~$250M series / ~6 games / ~2.5hrs
    flavor: 'The audience is smaller. The audience is wealthier. The math still works.',
    context: '4.8 million viewers. The hockey audience skews wealthy — the CPM reflects it.',
    source: '2025 Stanley Cup Finals. Yahoo Sports, Amra & Elma.',
  },

  // ── Cultural Ceremonies ──
  oscars: {
    name: 'The Oscars',
    cat: 'culture',
    desc: 'fashion + discourse + catalog bumps',
    audience: '17.9 million viewers',
    rate: 66667,    // $2M/30sec
    flavor: 'The ceremony is the seed. The real attention harvest comes after.',
    context: '17.9 million viewers. $2M per 30-second spot. Nominees see streaming spikes for weeks.',
    source: '98th Academy Awards (2026). Variety, Deadline.',
  },
  grammys: {
    name: 'The Grammys',
    cat: 'culture',
    desc: 'performances + streaming spikes',
    audience: '14.4 million viewers',
    rate: 30000,    // ~$900K-1M/30sec estimated
    flavor: 'A single performance can generate millions of streams overnight.',
    context: '14.4 million viewers. 74.8 million social interactions. 302.5 million video views.',
    source: '68th Grammy Awards (2026). Variety, CBS.',
  },

  // ── Political Inflection Points ──
  electionnight: {
    name: 'Election Night',
    cat: 'political',
    desc: 'compulsive attention',
    audience: '42.3 million viewers',
    rate: 50000,    // Estimated across 18 networks, 4-8hrs sustained
    flavor: 'Nobody is being entertained. They\'re watching because they have to know.',
    context: '42.3 million viewers across 18 networks. Hours of near-zero channel switching.',
    source: '2024 Presidential Election. Nielsen.',
  },
  stateofunion: {
    name: 'State of the Union',
    cat: 'political',
    desc: 'appointment TV, cross-demographic',
    audience: '36.6 million viewers',
    rate: 30000,    // Estimated from network ad rates across ~1.5hrs
    flavor: 'One of the only remaining appointment-TV political events.',
    context: '36.6 million viewers. Peak of 37.9M at 9:45 PM. Every major network, simultaneously.',
    source: '2025 Joint Address. Nielsen.',
  },

  // ── Digital-Native Moments ──
  kaicenat: {
    name: 'Kai Cenat Subathon',
    cat: 'digital',
    desc: 'one person, one camera',
    audience: '1 million viewers',
    rate: 7.72,     // ~$20M over 30 days = ~$7.72/sec
    flavor: 'One person generating Super Bowl-adjacent revenue from a living room.',
    context: '1,005,331 concurrent viewers. 1,031,736 subscribers. ~$20M in 30 days. No broadcast network.',
    source: 'Mafiathon 3 (Sept 2025). Streams Charts, TwitchTracker.',
  },
  lolworlds: {
    name: 'LoL Worlds Final',
    cat: 'digital',
    desc: '50M viewers, mostly invisible',
    audience: '50 million viewers',
    rate: 14000,    // Estimated from esports sponsorship + broadcast deals over ~5hr broadcast
    flavor: 'Most of this audience is invisible to traditional media measurement.',
    context: '50 million peak viewers including China. 6.9M excluding China. Primarily under 30.',
    source: 'Worlds 2024 Final. Esports Charts, KitGuru.',
  },
  mrbeast: {
    name: 'MrBeast Video Drop',
    cat: 'digital',
    desc: '$3,333 per content-second',
    audience: '33–52 million viewers',
    rate: 3333,     // ~$3M ad rev over ~15min of content
    flavor: 'Per-second attention value that rivals network television. One creator.',
    context: '33-52M views in the first 24 hours. ~$3M in ad revenue per 15-minute video.',
    source: 'MrBeast (2025). Social Blade, creator interviews.',
  },
  joerogan: {
    name: 'Joe Rogan Episode',
    cat: 'digital',
    desc: 'audio-first, 11M listeners',
    audience: '11 million listeners',
    rate: 11.57,    // ~$100K per episode / ~2.4hrs avg
    flavor: 'No visual real estate to sell. Monetizes at scale anyway.',
    context: '11 million listeners per episode. #1 on Spotify, Apple, and YouTube. Six years running.',
    source: 'JRE (2025). Hollywood Reporter, JRE Library.',
  },
  squidgame: {
    name: 'Netflix Premiere',
    cat: 'digital',
    desc: 'no ads — attention as retention',
    audience: '68 million viewers',
    rate: 39,       // 487.6M hours in 4 days, ~$0.10/hr internal value
    flavor: 'The value is invisible. It exists as retention, not revenue.',
    context: '68M views in 4 days. 487.6M hours watched. #1 in 92 countries. Zero ad dollars.',
    source: 'Squid Game S2 (Dec 2024). Variety, Netflix.',
  },
  primeday: {
    name: 'Amazon Prime Day',
    cat: 'digital',
    desc: 'attention as transaction',
    audience: '200+ million shoppers',
    rate: 69791,    // $24.1B / 4 days / 86400 sec
    flavor: 'No entertainment. No content. Pure commercial attention converted to purchases.',
    context: '$24.1 billion in 4 days. Equivalent to Black Friday + Cyber Monday combined.',
    source: 'Prime Day 2025. CNBC, Amazon.',
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
const momentsModeEl     = document.getElementById('moments-mode');
const platformModeEl    = document.getElementById('platform-mode');
const momentsValueEl    = document.getElementById('moments-value');
const momentsAudienceEl = document.getElementById('moments-audience');
const momentsContextEl  = document.getElementById('moments-context');
const momentsEyebrowEl  = document.getElementById('moments-eyebrow');
const momentsFlavorEl   = document.getElementById('moments-note-flavor');
const momentsEventsEl   = document.getElementById('moments-events');
const momentsSelectorEl = document.getElementById('moments-selector');
const bookSelectorEl    = document.getElementById('book-selector');
const modeToggleEl      = document.getElementById('mode-toggle');

// ─── Moments formatting ─────────────────────────────────────────────────
function fmtMoments(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(2);
}

// ─── Render event buttons for a category ────────────────────────────────
function renderCategoryEvents(cat) {
  momentsEventsEl.innerHTML = '';
  const events = Object.entries(MOMENTS).filter(([, v]) => v.cat === cat);
  events.forEach(([key, evt], i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'event-sep';
      sep.textContent = '·';
      momentsEventsEl.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'event-btn' + (key === selectedEventKey ? ' active' : '');
    btn.dataset.event = key;
    btn.innerHTML = `${evt.name}<span class="event-desc">${evt.desc}</span>`;
    momentsEventsEl.appendChild(btn);
  });
}

// ─── Select an event ────────────────────────────────────────────────────
function selectEvent(key) {
  selectedEventKey = key;
  momentsElapsed   = 0;
  momentsValue     = 0;
  momentsLastTick  = performance.now();
  momentsFlavorShown = false;
  momentsFlavorEl.classList.remove('visible');

  const evt = MOMENTS[key];
  momentsAudienceEl.textContent = evt.audience + ' watching';
  momentsContextEl.textContent  = evt.context;
  momentsFlavorEl.textContent   = evt.flavor;
  momentsValueEl.textContent    = '$0';

  // Update active states
  document.querySelectorAll('.event-btn').forEach(b => {
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

  // Show flavor note after 5 seconds
  if (momentsElapsed >= 5 && !momentsFlavorShown) {
    momentsFlavorEl.classList.add('visible');
    momentsFlavorShown = true;
  }

  requestAnimationFrame(momentsTick);
}
requestAnimationFrame(momentsTick);

// ─── Category switching ─────────────────────────────────────────────────
document.getElementById('moments-categories').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  selectedCat = btn.dataset.cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Pick first event in category
  const firstKey = Object.keys(MOMENTS).find(k => MOMENTS[k].cat === selectedCat);
  renderCategoryEvents(selectedCat);
  selectEvent(firstKey);
});

// ─── Event switching ────────────────────────────────────────────────────
momentsEventsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.event-btn');
  if (!btn) return;
  selectEvent(btn.dataset.event);
});

// ─── Mode switching ─────────────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;

  // Toggle mode button active states
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  if (mode === 'platform') {
    platformModeEl.style.display = '';
    momentsModeEl.style.display  = 'none';
    bookSelectorEl.style.display = '';
    momentsSelectorEl.style.display = 'none';
    platformLabelEl.style.display = '';
    lifetimeEntry.style.display = lifetimeValue > 0 ? 'block' : 'none';

    // Show platform about, hide moments about
    document.getElementById('about-platform').style.display = '';
    document.getElementById('about-moments').style.display = 'none';
  } else {
    platformModeEl.style.display = 'none';
    momentsModeEl.style.display  = '';
    bookSelectorEl.style.display = 'none';
    momentsSelectorEl.style.display = '';
    platformLabelEl.style.display = 'none';
    lifetimeEntry.style.display = 'none';

    // Show moments about, hide platform about
    document.getElementById('about-platform').style.display = 'none';
    document.getElementById('about-moments').style.display = '';

    // Reset moments counter for fresh entry
    momentsLastTick = performance.now();
    momentsElapsed  = 0;
    momentsValue    = 0;
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

// Initialize moments events and set first event data
renderCategoryEvents(selectedCat);
selectEvent(selectedEventKey);
