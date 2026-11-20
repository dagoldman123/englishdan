// Dan · English — small site behaviours

// "Show all reviews" toggle
(function () {
  var btn = document.getElementById('toggle-reviews');
  var list = document.getElementById('reviews');
  if (!btn || !list) return;
  var label = btn.querySelector('span');
  btn.addEventListener('click', function () {
    var open = list.classList.toggle('show-all');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'הצגת פחות ביקורות' : 'הצגת כל הביקורות';
    if (!open) list.scrollIntoView({ block: 'start' });
  });
})();

// Keep the footer year current
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Review ticker — a slim bar fixed to the bottom of the screen that shows the
// reviews from the "testimonials" section one at a time. It reads them straight
// from the page, so adding a review to that section adds it here too.
// Every review is shown in full: short ones sit still, long ones scroll up one
// line at a time at reading pace, and the next review only comes once the last
// line has had time to be read.
(function () {
  var cards = document.querySelectorAll('#reviews .review');
  if (!cards.length) return;

  var CHARS_PER_SEC = 15;   // comfortable reading pace
  var MIN_SHOW_MS = 4500;   // shortest time any review stays on screen
  var MIN_LINE_MS = 1800;   // shortest time per line when scrolling
  var END_HOLD_MS = 1500;   // extra pause on the last line before moving on
  var VISIBLE_LINES = 2;    // lines of text the bar shows at once
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var reviews = [];
  Array.prototype.forEach.call(cards, function (card) {
    var p = card.querySelector('p');
    var footer = card.querySelector('footer');
    if (!p || !footer) return;
    var av = footer.querySelector('.avatar');
    var initial = av ? av.textContent.trim() : '';
    reviews.push({
      text: p.textContent.replace(/\s+/g, ' ').trim(),
      dir: p.getAttribute('dir') || 'rtl',
      lang: p.getAttribute('lang') || 'he',
      name: footer.textContent.replace(initial, '').trim(),
      initial: initial
    });
  });
  if (!reviews.length) return;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  var bar = el('a', 'review-ticker');
  bar.href = '#testimonials';
  bar.setAttribute('aria-label', 'ביקורות תלמידים – לכל הביקורות');

  var inner = el('div', 'container rt-inner');
  var slide = el('div', 'rt-slide');
  slide.setAttribute('aria-hidden', 'true');
  var avatar = el('span', 'avatar');
  var body = el('div', 'rt-body');
  var meta = el('div', 'rt-meta');
  var name = el('span', 'rt-name');
  var starsSrc = cards[0].querySelector('.stars');
  var stars = starsSrc ? starsSrc.cloneNode(true) : el('span');
  stars.removeAttribute('aria-label');
  stars.setAttribute('aria-hidden', 'true');
  var win = el('div', 'rt-window');
  var text = el('p', 'rt-text');
  var all = el('span', 'rt-all');
  all.textContent = 'לכל הביקורות ←';

  meta.appendChild(name); meta.appendChild(stars);
  win.appendChild(text);
  body.appendChild(meta); body.appendChild(win);
  slide.appendChild(avatar); slide.appendChild(body);
  inner.appendChild(slide); inner.appendChild(all);
  bar.appendChild(inner);
  document.body.appendChild(bar);
  document.documentElement.classList.add('has-ticker');

  // Keep page content and the WhatsApp button clear of the bar
  function syncHeight() {
    document.documentElement.style.setProperty('--ticker-h', bar.offsetHeight + 'px');
  }

  var index = 0, offset = 0, lines = 1, lineH = 20, perLine = MIN_LINE_MS;
  var timer = null, hovering = false, hidden = false;

  function measure() {
    lineH = parseFloat(getComputedStyle(text).lineHeight) || 20;
    lines = Math.max(1, Math.round(text.offsetHeight / lineH));
    perLine = Math.max(MIN_LINE_MS, (reviews[index].text.length / lines) / CHARS_PER_SEC * 1000);
    offset = Math.min(offset, maxOffset());
    moveTo(offset, true);
  }
  function maxOffset() { return Math.max(0, lines - VISIBLE_LINES); }
  function moveTo(n, instant) {
    if (instant) text.style.transition = 'none';
    text.style.transform = 'translateY(' + (-n * lineH) + 'px)';
    if (instant) { void text.offsetWidth; text.style.transition = ''; }
  }

  // How long to wait before the next move (scroll one line, or next review)
  function delay() {
    if (maxOffset() === 0) {
      return Math.max(MIN_SHOW_MS, reviews[index].text.length / CHARS_PER_SEC * 1000 + END_HOLD_MS);
    }
    if (offset === 0) return VISIBLE_LINES * perLine + 800;
    if (offset < maxOffset()) return perLine;
    return perLine + END_HOLD_MS;
  }

  function fill(n) {
    var r = reviews[n];
    avatar.textContent = r.initial;
    name.textContent = r.name;
    text.textContent = r.text;
    text.setAttribute('dir', r.dir);
    text.setAttribute('lang', r.lang);
    offset = 0;
    measure();
  }

  function schedule() {
    clearTimeout(timer);
    if (hovering || hidden) return;
    timer = setTimeout(step, delay());
  }

  function step() {
    if (offset < maxOffset()) {
      offset++;
      moveTo(offset, reduceMotion);
      schedule();
    } else {
      nextReview();
    }
  }

  function nextReview() {
    index = (index + 1) % reviews.length;
    if (reduceMotion) { fill(index); schedule(); return; }
    slide.classList.add('leaving');
    setTimeout(function () {
      fill(index);
      slide.classList.remove('leaving');
      slide.classList.add('entering');
      void slide.offsetWidth;
      slide.classList.remove('entering');
      schedule();
    }, 350);
  }

  function setPaused() {
    if (hovering || hidden) clearTimeout(timer); else schedule();
  }

  bar.addEventListener('mouseenter', function () { hovering = true; setPaused(); });
  bar.addEventListener('mouseleave', function () { hovering = false; setPaused(); });
  bar.addEventListener('focus', function () { hovering = true; setPaused(); });
  bar.addEventListener('blur', function () { hovering = false; setPaused(); });
  document.addEventListener('visibilitychange', function () { hidden = document.hidden; setPaused(); });

  function onResize() { syncHeight(); measure(); }
  if (window.ResizeObserver) new ResizeObserver(syncHeight).observe(bar);
  window.addEventListener('resize', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  fill(0);
  syncHeight();
  schedule();
})();
