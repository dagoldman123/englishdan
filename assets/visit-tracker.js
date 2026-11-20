/* Visit counter for Dan's desktop gauge.
   No cookies and no IP address stored: a random ID is kept in this browser only.
   Open the site once with ?notrack on your own devices so your visits aren't counted
   (?track turns counting back on). */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwCEIB7F7blOFLTXKqyWgMutnRAA8y-faqbWfGWGANuJrubrT0cFtlN6fgSWne0TlBIyA/exec';

  try {
    var q = location.search;
    if (/[?&]notrack\b/.test(q)) localStorage.setItem('dg_notrack', '1');
    if (/[?&]track\b/.test(q)) localStorage.removeItem('dg_notrack');
    if (localStorage.getItem('dg_notrack') === '1') return;
  } catch (e) {}

  var ua = navigator.userAgent || '';
  if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(ua)) return;

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function keep(store, key) {
    try { var v = store.getItem(key); if (!v) { v = rid(); store.setItem(key, v); } return v; }
    catch (e) { return rid(); }
  }

  var known = null;
  try { known = localStorage.getItem('dg_vid'); } catch (e) {}
  var vid = keep(localStorage, 'dg_vid');
  var sid = keep(sessionStorage, 'dg_sid');
  try { if (!known) localStorage.setItem('dg_fsid', sid); } catch (e) {}
  var returning = false;
  try { returning = localStorage.getItem('dg_fsid') !== sid; } catch (e) {}

  var dev = (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) ? 'Tablet'
          : /Mobi|iPhone|Android/i.test(ua) ? 'Phone' : 'Computer';

  var path = location.pathname;
  var page = /\/students(\/|$)/.test(path) ? 'Students area'
           : (/\/$|index\.html$/.test(path) ? 'Home page' : path.split('/').filter(Boolean).pop());

  function source() {
    try { var saved = sessionStorage.getItem('dg_src'); if (saved) return saved; } catch (e) {}
    var src = 'Direct', utm = '', ref = document.referrer || '', host = '';
    try { utm = new URLSearchParams(location.search).get('utm_source') || ''; } catch (e) {}
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) {}
    var name = (utm || host).toLowerCase();
    if (!name || host === location.hostname) src = 'Direct';
    else if (/mail|android\.gm/.test(name)) src = 'Email';
    else if (/google/.test(name)) src = 'Google';
    else if (/whatsapp|wa\.me/.test(name)) src = 'WhatsApp';
    else if (/instagram/.test(name)) src = 'Instagram';
    else if (/facebook|fb\.|^fb$|messenger/.test(name)) src = 'Facebook';
    else if (/linkedin|lnkd/.test(name)) src = 'LinkedIn';
    else if (/tiktok/.test(name)) src = 'TikTok';
    else if (/youtube|youtu\.be/.test(name)) src = 'YouTube';
    else if (/bing/.test(name)) src = 'Bing';
    else if (/^t\.co$|twitter|^x\.com$/.test(name)) src = 'X';
    else src = utm || host;
    try { sessionStorage.setItem('dg_src', src); } catch (e) {}
    return src;
  }

  function send(o) {
    var body = JSON.stringify(o);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) {}
    try {
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true,
                        headers: { 'Content-Type': 'text/plain' }, body: body });
    } catch (e) {}
  }

  // Rough location (city / country / map point) for this visit; looked up once per visit.
  function place(cb) {
    try { var saved = sessionStorage.getItem('dg_geo2'); if (saved) return cb(JSON.parse(saved)); } catch (e) {}
    var done = false;
    function finish(g, save) {
      if (done) return; done = true;
      if (save) { try { sessionStorage.setItem('dg_geo2', JSON.stringify(g)); } catch (e) {} }
      cb(g);
    }
    setTimeout(function () { finish({}, false); }, 2500);
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        function r2(v) { var n = parseFloat(v); return isFinite(n) ? Math.round(n * 100) / 100 : ''; }
        finish({ city: j.city || '', country: j.country || '', cc: j.country_code || '',
                 lat: r2(j.latitude), lon: r2(j.longitude) }, true);
      })
      .catch(function () { finish({}, false); });
  }

  // Time on page: only counts while the page is actually on screen.
  var pv = rid(), shownMs = 0, since = document.visibilityState === 'visible' ? Date.now() : 0;
  function secs() { return Math.round((shownMs + (since ? Date.now() - since : 0)) / 1000); }
  function ping() { send({ t: 'ping', pv: pv, s: secs() }); }

  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

  place(function (g) {
    send({ t: 'view', vid: vid, sid: sid, pv: pv, page: page, src: source(), city: g.city || '',
           country: g.country || '', cc: g.cc || '', lat: g.lat === undefined ? '' : g.lat,
           lon: g.lon === undefined ? '' : g.lon, tz: tz, dev: dev, ret: returning, lang: navigator.language || '' });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (since) { shownMs += Date.now() - since; since = 0; }
      ping();
    } else {
      since = Date.now();
    }
  });
  window.addEventListener('pagehide', ping);

  var beats = 0;
  var timer = setInterval(function () {
    if (!since) return;
    ping();
    if (++beats >= 30) clearInterval(timer);   // stop after ~30 minutes on one page
  }, 60000);
})();
