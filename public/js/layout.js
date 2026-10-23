const pages = [
  { href: '/', label: 'Home' },
  { href: '/garden', label: 'My Garden' },
  { href: '/why', label: 'Why Habits' },
  { href: '/about', label: 'About' }
];

function currentPage() { return location.pathname.replace(/\/$/, '') || '/'; }
function syncThemeButton(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.querySelector('#theme-toggle');
  if (button) {
    button.textContent = theme === 'dark' ? '☀' : '☾';
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1C231F' : '#FAF6EC');
}

function mountHeader() {
  const active = currentPage();
  const garden = active === '/garden';
  const links = pages.map(page => `<a class="nav-link" href="${page.href}"${page.href === active ? ' aria-current="page"' : ''}>${page.label}</a>`).join('');
  document.querySelector('#site-header').innerHTML = `<header class="site-header"><div class="nav-inner"><a class="brand" href="/" aria-label="Rootine home"><span class="brand-leaf">✳</span> Rootine</a><button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span><span></span></button><nav class="site-menu" id="primary-nav" aria-label="Main navigation">${links}<a class="button button-primary nav-cta" href="/garden">Open my garden</a></nav><div class="nav-tools"><span class="header-date${garden ? '' : ' hidden'}" id="header-date"></span><button class="icon-button" id="theme-toggle" type="button" aria-label="Switch color theme" title="Switch color theme">☾</button></div></div></header>`;
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('#menu-toggle');
  const closeMenu = () => { header.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation menu'); };
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  document.querySelectorAll('.site-menu a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('rootine-theme', theme);
    syncThemeButton(theme);
  });
}

function mountFooter() {
  document.querySelector('#site-footer').innerHTML = `<footer class="site-footer"><div class="footer-inner"><a class="footer-brand" href="/">✳ Rootine</a><p>A little care, at your own pace.</p><nav aria-label="Footer navigation"><a href="/garden">My Garden</a><a href="/why">Why Habits</a><a href="/about">About</a></nav><span class="footer-note">© ${new Date().getFullYear()} Rootine</span></div></footer>`;
}

function mountScrollReveals() {
  const targets = [...document.querySelectorAll('.reveal:not(.is-visible):not(.is-pending)')];
  if (!targets.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    targets.forEach(target => target.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  targets.forEach(target => { target.classList.add('is-pending'); observer.observe(target); });
}

const transitionQuotes = [
  'Every big garden begins with one small seed.',
  'A little care, returned to often, changes the landscape.',
  'Slow roots still know how to find their way.',
  'Small steps make a path you can follow again.',
  'Give today one gentle thing to grow.',
  'Patience is care that keeps showing up.',
  'A quiet beginning can hold a remarkable future.',
  'Growth gathers in the moments we tend.',
  'Let the next small thing be enough for today.'
];
const transitionMs = matchMedia('(prefers-reduced-motion: reduce)').matches ? 130 : 700;

function updateCurtainCopy(index, intro = false) {
  const root = document.documentElement;
  root.dataset.curtainCopy = `${intro ? '✳ ROOTINE\n\n' : ''}“${transitionQuotes[index]}”`;
  root.dataset.curtainQuote = String(index);
}

function mountPageTransitions() {
  const root = document.documentElement;
  const pausedNativeRules = [];
  const pauseNativeTransitionForCurtain = () => {
    for (const sheet of document.styleSheets) {
      try {
        const rules = [...sheet.cssRules];
        for (let index = rules.length - 1; index >= 0; index -= 1) {
          if (rules[index].cssText.trim().startsWith('@view-transition')) {
            pausedNativeRules.push({ sheet, index, cssText: rules[index].cssText });
            sheet.deleteRule(index);
          }
        }
      } catch {}
    }
  };
  const restoreNativeTransition = () => {
    for (const { sheet, index, cssText } of pausedNativeRules.splice(0)) {
      try { sheet.insertRule(cssText, Math.min(index, sheet.cssRules.length)); } catch {}
    }
  };
  if (root.dataset.curtain === 'intro' || root.dataset.curtain === 'incoming') {
    const intro = root.dataset.curtain === 'intro';
    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : intro ? 1200 : 600;
    window.setTimeout(() => {
      root.dataset.curtain = 'lifting';
      window.setTimeout(() => { delete root.dataset.curtain; delete root.dataset.curtainCopy; }, delay);
    }, delay);
  }

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    restoreNativeTransition();
    delete root.dataset.curtain;
    delete root.dataset.curtainCopy;
    sessionStorage.removeItem('rootine-curtain-next');
  });

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (anchor.target && anchor.target.toLowerCase() !== '_self' || anchor.hasAttribute('download')) return;
    const target = new URL(anchor.href, location.href);
    if (target.origin !== location.origin || target.hash && target.pathname === location.pathname || target.pathname === location.pathname && target.search === location.search) return;
    if (!['/', '/garden', '/why', '/about'].includes(target.pathname)) return;
    pauseNativeTransitionForCurtain();
    event.preventDefault();
    if (root.dataset.curtain === 'out') return;
    let previous = Number(sessionStorage.getItem('rootine-last-transition-quote'));
    if (!Number.isInteger(previous) || previous < 0 || previous >= transitionQuotes.length) previous = -1;
    const next = (previous + 1 + Math.floor(Math.random() * (transitionQuotes.length - 1))) % transitionQuotes.length;
    sessionStorage.setItem('rootine-last-transition-quote', String(next));
    sessionStorage.setItem('rootine-curtain-next', String(next));
    updateCurtainCopy(next);
    root.dataset.curtain = 'out';
    window.setTimeout(() => { location.href = target.href; }, transitionMs);
  });
}

mountHeader();
mountFooter();
const savedTheme = localStorage.getItem('rootine-theme');
syncThemeButton(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (!localStorage.getItem('rootine-theme')) syncThemeButton(event.matches ? 'dark' : 'light');
});
mountScrollReveals();
mountPageTransitions();
window.addEventListener('rootine:refresh-reveals', mountScrollReveals);
