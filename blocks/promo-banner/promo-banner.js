export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  const picCol = cols.find((c) => c.querySelector('picture'));
  const textCol = cols.find((c) => !c.querySelector('picture'));

  if (picCol) {
    picCol.classList.add('promo-banner-bg');
    const img = picCol.querySelector('img');
    if (img) {
      block.style.backgroundImage = `url(${img.src})`;
    }
  }

  if (textCol) {
    textCol.classList.add('promo-banner-content');
    const paragraphs = [...textCol.querySelectorAll('p')];
    if (paragraphs.length >= 1) {
      paragraphs[0].classList.add('promo-banner-heading');
    }
    if (paragraphs.length >= 3 && !paragraphs[1].querySelector('a')) {
      paragraphs[1].classList.add('promo-banner-eyebrow');
      paragraphs[2].classList.add('promo-banner-subheading');
    }
  }
}
