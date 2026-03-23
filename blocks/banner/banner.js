export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  const picCol = cols.find((c) => c.querySelector('picture'));
  const textCol = cols.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));

  if (picCol) picCol.classList.add('banner-image');
  if (textCol) textCol.classList.add('banner-content');

  // add accent decoration
  const accent = document.createElement('div');
  accent.className = 'banner-accent';
  block.querySelector(':scope > div').append(accent);
}
