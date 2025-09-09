// Register/update the service worker (optional but nice)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('./service-worker.js?v=11');
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      setTimeout(() => window.location.reload(), 100);
    });
    if (reg.update) reg.update();
  });
}

// --- Cloudflare virtual pageview helper ---
function cfVirtualPageview(path) {
  try {
    window._cfq = window._cfq || [];
    window._cfq.push(['set', 'page', path]);
    window._cfq.push(['trackPageview']);
  } catch (e) {}
}

// A) Chrome/Edge (Android/desktop) fire this event when installed from browser UI
window.addEventListener('appinstalled', () => {
  cfVirtualPageview('/pwa-installed');
});

// B) iOS Safari never fires appinstalled; detect standalone mode on first run
(function () {
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (typeof navigator !== 'undefined' && navigator.standalone); // iOS < 13
  if (isStandalone) {
    const k = 'pwa_ios_install_logged';
    if (!localStorage.getItem(k)) {
      cfVirtualPageview('/pwa-installed-ios');
      localStorage.setItem(k, '1');
    }
  }
})();

// C) Fallback: first time a SW is ready, count it once per device
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    const k = 'pwa_sw_ready_logged';
    if (!localStorage.getItem(k)) {
      cfVirtualPageview('/pwa-sw-ready');
      localStorage.setItem(k, '1');
    }
  });
}


// ---- Bell schedule logic ----
const RAW = {
  "A": [
    {"period": "1", "start": "7:50", "end": "8:45"},
    {"period": "2", "start": "8:50", "end": "9:45"},
    {"period": "3", "start": "9:50", "end": "10:45"},
    {"period": "Lunch", "start": "10:50", "end": "11:20"},
    {"period": "4", "start": "11:25", "end": "12:20"},
    {"period": "5", "start": "12:25", "end": "1:20"},
    {"period": "6", "start": "1:25", "end": "2:20"}
  ],
  "B": [
    {"period": "1", "start": "7:50", "end": "8:40"},
    {"period": "2", "start": "8:45", "end": "9:35"},
    {"period": "10 (Advisory)", "start": "9:35", "end": "10:05"},
    {"period": "3", "start": "10:10", "end": "11:00"},
    {"period": "Lunch", "start": "11:05", "end": "11:35"},
    {"period": "4", "start": "11:40", "end": "12:30"},
    {"period": "5", "start": "12:35", "end": "1:25"},
    {"period": "6", "start": "1:30", "end": "2:20"}
  ],
  "C": [
    {"period": "1", "start": "7:50", "end": "8:30"},
    {"period": "2", "start": "8:35", "end": "9:20"},
    {"period": "3", "start": "9:25", "end": "10:05"},
    {"period": "4", "start": "10:10", "end": "10:50"},
    {"period": "5", "start": "10:55", "end": "11:35"},
    {"period": "6", "start": "11:40", "end": "12:20"},
    {"period": "Lunch", "start": "12:20", "end": "12:50"}
  ],
  "D": [
    {"period": "1", "start": "7:50", "end": "8:35"},
    {"period": "2", "start": "8:40", "end": "9:25"},
    {"period": "Assembly", "start": "9:30", "end": "10:25"},
    {"period": "3", "start": "10:30", "end": "11:15"},
    {"period": "Lunch", "start": "11:20", "end": "11:50"},
    {"period": "4", "start": "11:55", "end": "12:40"},
    {"period": "5", "start": "12:45", "end": "1:30"},
    {"period": "6", "start": "1:35", "end": "2:20"}
  ]
};

function hhmmToMinutes(hhmm){ const [h,m]=hhmm.split(':').map(Number); return h*60+m; }
function minutesToClock(mins){
  mins = ((mins % (48*60)) + 48*60) % (48*60);
  let h = Math.floor(mins/60), m = mins % 60;
  const hour24 = h % 24, ampm = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12; if (hour12 === 0) hour12 = 12;
  return hour12 + ':' + String(m).padStart(2,'0') + ' ' + ampm;
}
// Treat 1–3 AM times as afternoon for sort order in a school day
function daySortKey(hhmm){ const [h,m]=hhmm.split(':').map(Number); let v=h*60+m; if(h>=1&&h<=3) v+=12*60; return v; }

function inflateDay(blocks){
  const sorted = [...blocks].sort((a,b)=>daySortKey(a.start)-daySortKey(b.start));
  let last = 0;
  return sorted.map(b=>{
    let s = hhmmToMinutes(b.start), e = hhmmToMinutes(b.end);
    while (s < last) s += 12*60;
    while (e < s) e += 12*60;
    last = e;
    return { period:b.period, startMin:s, endMin:e };
  });
}
const SCHEDULES = {};
for (const key of Object.keys(RAW)) SCHEDULES[key] = inflateDay(RAW[key]);

function weekdayToDefaultKey(d){ if(d===1||d===5) return 'A'; if(d===2||d===4) return 'B'; if(d===3) return 'C'; return 'A'; }
function pickScheduleKey(now, forced){ return forced || weekdayToDefaultKey(now.getDay()); }

function computeNow(key, minutesNow){
  const blocks = SCHEDULES[key] || [];
  for (const b of blocks) if (minutesNow >= b.startMin && minutesNow < b.endMin) return { ...b, status:'in' };
  for (const b of blocks) if (minutesNow < b.startMin) return { ...b, status:'before' };
  return { status:'after' };
}

function renderList(key, minutesNow){
  const blocks = SCHEDULES[key] || [];
  const list = document.getElementById('list');
  list.innerHTML = '';
  for (const b of blocks){
    const now = minutesNow >= b.startMin && minutesNow < b.endMin;
    const row = document.createElement('div');
    row.className = 'row' + (now ? ' now' : '');
    const left = document.createElement('div');
    const right = document.createElement('div');
    left.innerHTML = `<strong>${b.period}</strong>` + (now ? ' <span class="pill">Current period</span>' : '');
    right.textContent = minutesToClock(b.startMin) + ' – ' + minutesToClock(b.endMin);
    row.append(left, right);
    list.appendChild(row);
  }
}

function renderTodayLine(now){
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('today').textContent = now.toLocaleDateString(undefined, opts);
}

function tick(){
  const forced = document.getElementById('forceSchedule').value || null;
  const now = new Date();
  renderTodayLine(now);
  const minutesNow = now.getHours()*60 + now.getMinutes();
  const key = pickScheduleKey(now, forced);
  const result = computeNow(key, minutesNow);
  renderList(key, minutesNow);

  const summary = document.getElementById('summary');
  let html = `<div class="row"><div>Schedule</div><div><strong>${key}</strong></div></div>`;
  if (result.status === 'in'){
    const endsAt = minutesToClock(result.endMin);
    const minsLeft = result.endMin - minutesNow;
    html += `<div class="row"><div>Current period</div><div><strong>${result.period}</strong></div></div>`;
    html += `<div class="row"><div>Ends</div><div>${endsAt} <span class="muted">(${minsLeft} min)</span></div></div>`;
  } else if (result.status === 'before'){
    const startsAt = minutesToClock(result.startMin);
    const minsTo = result.startMin - minutesNow;
    html += `<div class="row"><div>Next</div><div><strong>${result.period}</strong> at ${startsAt} <span class="muted">(${minsTo} min)</span></div></div>`;
  } else {
    html += `<div class="row"><div>Status</div><div>After school</div></div>`;
  }
  summary.innerHTML = html;
}

['forceSchedule'].forEach(id => document.getElementById(id).addEventListener('input', tick));
tick();
setInterval(tick, 15000);
