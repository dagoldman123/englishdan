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
