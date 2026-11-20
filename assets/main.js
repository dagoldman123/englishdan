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
(function () {
  var cards = document.querySelectorAll('#reviews .review');
  if (!cards.length) return;

  var INTERVAL = 7000; // ms each review stays on screen
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var reviews = [];
  Array.prototype.forEach.call(cards, function (card) {
    var p = card.querySelector('p');
    var footer = card.querySelector('footer');
    if (!p || !footer) return;
    var avatar = footer.querySelector('.avatar');
    var initial = avatar ? avatar.textContent.trim() : '';
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
  bar.style.setProperty('--rt-interval', INTERVAL + 'ms');

  var progress = el('span', 'rt-progress');
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
  var text = el('p', 'rt-text');
  var all = el('span', 'rt-all');
  all.textContent = 'לכל הביקורות ←';

  meta.appendChild(name); meta.appendChild(stars);
  body.appendChild(meta); body.appendChild(text);
  slide.appendChild(avatar); slide.appendChild(body);
  inner.appendChild(slide); inner.appendChild(all);
  bar.appendChild(progress); bar.appendChild(inner);
  document.body.appendChild(bar);
  document.documentElement.classList.add('has-ticker');

  // Keep page content and the WhatsApp button clear of the bar
  function syncHeight() {
    document.documentElement.style.setProperty('--ticker-h', bar.offsetHeight + 'px');
  }
  syncHeight();
  if (window.ResizeObserver) new ResizeObserver(syncHeight).observe(bar);
  else window.addEventListener('resize', syncHeight);

  var index = 0, timer = null, hovering = false, hidden = false;

  function fill(n) {
    var r = reviews[n];
    avatar.textContent = r.initial;
    name.textContent = r.name;
    text.textContent = r.text;
    text.setAttribute('dir', r.dir);
    text.setAttribute('lang', r.lang);
  }

  function restartProgress() {
    progress.classList.remove('run');
    void progress.offsetWidth;
    progress.classList.add('run');
  }

  function schedule() {
    clearTimeout(timer);
    if (hovering || hidden) return;
    restartProgress();
    timer = setTimeout(next, INTERVAL);
  }

  function next() {
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
    var paused = hovering || hidden;
    bar.classList.toggle('is-paused', paused);
    if (paused) clearTimeout(timer); else schedule();
  }

  bar.addEventListener('mouseenter', function () { hovering = true; setPaused(); });
  bar.addEventListener('mouseleave', function () { hovering = false; setPaused(); });
  bar.addEventListener('focus', function () { hovering = true; setPaused(); });
  bar.addEventListener('blur', function () { hovering = false; setPaused(); });
  document.addEventListener('visibilitychange', function () { hidden = document.hidden; setPaused(); });

  fill(0);
  schedule();
})();
