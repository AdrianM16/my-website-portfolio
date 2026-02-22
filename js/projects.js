(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  const chips = qsa('[data-filter]');
  const cards = qsa('[data-project-card]');
  const all = 'all';

  const setActive = (val) => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === val)));
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(',').map(x=>x.trim());
      const show = val === all || tags.includes(val);
      card.style.display = show ? '' : 'none';
    });
  };

  const initial = qs('[data-filter][aria-pressed="true"]')?.dataset.filter || all;
  setActive(initial);

  chips.forEach(chip => {
    chip.addEventListener('click', () => setActive(chip.dataset.filter));
  });
})();
