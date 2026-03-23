export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  const picCol = cols.find((c) => c.querySelector('picture'));
  const textCol = cols.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));

  if (picCol) {
    picCol.classList.add('hero-image');
    const picture = picCol.querySelector('picture');
    if (picture) {
      block.style.backgroundImage = `url(${picture.querySelector('img')?.src || ''})`;
      block.classList.add('hero-has-bg');
    }
  }

  if (textCol) {
    textCol.classList.add('hero-content');
    const paragraphs = textCol.querySelectorAll('p');
    if (paragraphs.length > 0) {
      const first = paragraphs[0];
      const heading = textCol.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && first !== heading && !first.querySelector('a') && first.compareDocumentPosition(heading) === Node.DOCUMENT_POSITION_FOLLOWING) {
        first.classList.add('hero-pretitle');
      }
    }
  }
}
