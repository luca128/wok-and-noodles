/* Wok and Noodles — măsurare conversii (GA4 + consimțământ GDPR)
 * 1. Pune ID-ul GA4 mai jos (Admin → Fluxuri de date → Web → „ID de evaluare”, arată ca G-XXXXXXXXXX).
 * 2. Cât timp ID-ul e gol, scriptul nu face nimic: fără banner, fără cookie-uri.
 * GA se încarcă DOAR după ce vizitatorul apasă „Accept”.
 */
(function () {
  var GA_ID = 'G-5LX5TPP0NQ'; // ← ex: 'G-ABC123XYZ9'
  if (!GA_ID) return;

  var KEY = 'wn-consent';
  var loaded = false;

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  function loadGA() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  /* ---------- evenimente de conversie ---------- */
  function where(el) {
    var sec = el.closest('section, nav, footer, .wa-float, .mobile-menu, .cta-strip, .menu-cta');
    if (!sec) return 'altul';
    if (sec.id) return sec.id;
    if (sec.classList.contains('wa-float')) return 'buton-plutitor';
    if (sec.classList.contains('mobile-menu')) return 'meniu-mobil';
    if (sec.classList.contains('cta-strip') || sec.classList.contains('menu-cta')) return 'cta';
    if (sec.tagName === 'SECTION' && sec.classList.length) return sec.classList[0].replace(/-section$/, '');
    return sec.tagName.toLowerCase();
  }

  var RULES = [
    [/^tel:/, 'click_telefon'],
    [/wa\.me|whatsapp/, 'click_whatsapp'],
    [/glovoapp\.com/, 'click_glovo'],
    [/wolt\.com/, 'click_wolt'],
    [/meniu\.pdf/, 'deschide_meniu'],
    [/g\.page\/r\/.*review/, 'click_recenzie'],
    [/google\.[a-z.]+\/maps|maps\.app\.goo\.gl/, 'click_directii'],
    [/facebook\.com|instagram\.com|tiktok\.com/, 'click_social']
  ];

  document.addEventListener('click', function (e) {
    if (!loaded) return;
    var a = e.target.closest('a[href], .map-facade');
    if (!a) return;
    if (a.classList.contains('map-facade')) {
      gtag('event', 'deschide_harta', { locatie: where(a), pagina: location.pathname });
      return;
    }
    var href = a.getAttribute('href') || '';
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(href)) {
        var p = { locatie: where(a), pagina: location.pathname, link: href.slice(0, 100) };
        if (RULES[i][1] === 'click_social') p.retea = (href.match(/facebook|instagram|tiktok/) || [''])[0];
        gtag('event', RULES[i][1], p);
        return;
      }
    }
  }, true);

  /* ---------- banner consimțământ ---------- */
  function banner() {
    if (document.getElementById('wn-consent')) return;
    var css = document.createElement('style');
    css.textContent =
      '#wn-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:560px;margin:0 auto;background:#0D1117;color:#fff;border:1px solid rgba(245,124,0,.35);border-radius:12px;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.4);font:14px/1.6 "DM Sans","DM Sans Fallback",sans-serif}' +
      '#wn-consent p{margin:0 0 14px;color:rgba(255,255,255,.85)}' +
      '#wn-consent a{color:#F57C00;text-decoration:underline}' +
      '#wn-consent .b{display:flex;gap:10px;flex-wrap:wrap}' +
      '#wn-consent button{flex:1;min-width:120px;min-height:44px;border-radius:6px;font:500 14px "DM Sans","DM Sans Fallback",sans-serif;cursor:pointer}' +
      '#wn-consent .ok{background:#F57C00;color:#0D1117;border:1px solid #F57C00}' +
      '#wn-consent .no{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'wn-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Preferințe cookie');
    var pol = location.pathname.indexOf('/blog/') > -1 ? '../politica-confidentialitate.html' : 'politica-confidentialitate.html';
    d.innerHTML = '<p>Folosim cookie-uri de analiză (Google Analytics) ca să vedem ce funcționează pe site. Le activăm doar dacă ești de acord. <a href="' + pol + '#cookie">Detalii</a></p>' +
      '<div class="b"><button type="button" class="no">Refuz</button><button type="button" class="ok">Accept</button></div>';
    document.body.appendChild(d);
    d.querySelector('.ok').onclick = function () { setChoice('granted'); d.remove(); loadGA(); };
    d.querySelector('.no').onclick = function () {
      setChoice('denied'); d.remove();
      document.cookie.split(';').forEach(function (c) {
        var n = c.split('=')[0].trim();
        if (/^_ga/.test(n)) document.cookie = n + '=; Max-Age=0; path=/; domain=' + location.hostname.replace(/^www\./, '.');
      });
    };
  }

  /* link „Setări cookie” din footer: <a href="#" data-cookie-settings> */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cookie-settings]');
    if (!t) return;
    e.preventDefault();
    try { localStorage.removeItem(KEY); } catch (err) {}
    banner();
  });

  function init() {
    var c = getChoice();
    if (c === 'granted') loadGA();
    else if (c !== 'denied') setTimeout(banner, 1500); // după prima afișare, ca să nu încurce viteza
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
