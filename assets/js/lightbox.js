(function () {
  var links = [].slice.call(document.querySelectorAll('.gallery a'));
  var dlg = document.getElementById('lightbox');
  if (!links.length || !dlg || typeof dlg.showModal !== 'function') return;

  var img = dlg.querySelector('img');
  var cap = dlg.querySelector('.lb-cap');
  var index = 0;

  function show(n) {
    index = (n + links.length) % links.length;
    var a = links[index];
    var thumb = a.querySelector('img');
    img.src = a.href;
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = (index + 1) + ' / ' + links.length + (img.alt ? ' · ' + img.alt : '');
  }

  function open(n) {
    show(n);
    dlg.showModal();
    document.documentElement.classList.add('lb-open');
  }

  links.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      // Let modified clicks (new tab, etc.) behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      open(n);
    });
  });

  dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
  dlg.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });

  // Click on the dark area (not the image or buttons) closes.
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('lb-stage')) dlg.close();
  });

  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('lb-open');
    img.removeAttribute('src');
  });

  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe on touch screens.
  var startX = null;
  dlg.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
})();
