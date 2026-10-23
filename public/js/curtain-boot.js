(() => {
  const quotes = [
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
  try {
    const pending = sessionStorage.getItem('rootine-curtain-next');
    let intro = false;
    let quote;
    if (pending !== null) {
      quote = Number(pending);
      sessionStorage.removeItem('rootine-curtain-next');
    } else if (!sessionStorage.getItem('rootine-intro-seen')) {
      intro = true;
      sessionStorage.setItem('rootine-intro-seen', '1');
      quote = Math.floor(Math.random() * quotes.length);
    }
    if (intro || pending !== null) {
      const root = document.documentElement;
      root.dataset.curtain = intro ? 'intro' : 'incoming';
      root.dataset.curtainCopy = `${intro ? '✳ ROOTINE\n\n' : ''}“${quotes[quote]}”`;
      root.dataset.curtainQuote = String(quote);
      sessionStorage.setItem('rootine-last-transition-quote', String(quote));
      window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        delete root.dataset.curtain;
        delete root.dataset.curtainCopy;
      });
      // If a later module fails, release the visual fallback automatically.
      window.setTimeout(() => {
        if (root.dataset.curtain === 'intro' || root.dataset.curtain === 'incoming') {
          delete root.dataset.curtain;
          delete root.dataset.curtainCopy;
        }
      }, 1800);
    }
  } catch {}
})();
