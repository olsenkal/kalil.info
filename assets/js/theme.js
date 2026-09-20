(function () {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function effective() {
    return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  }

  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();
