document.addEventListener('DOMContentLoaded', () => {
  fetch('articles.json')
    .then((res) => res.ok ? res.json() : Promise.reject(new Error('No articles.json')))
    .then(({ articles }) => {
      renderSidebar(articles);
      renderCarousel(articles);
    })
    .catch(() => {
      // Fail silently if file is missing
    });
});

function renderSidebar(articles) {
  const ul = document.getElementById('sidebar-list');
  if (!ul) return;
  ul.innerHTML = '';

  const homeLi = document.createElement('li');
  const homeA = document.createElement('a');
  homeA.href = 'index.html';
  homeA.textContent = 'Home';
  homeLi.appendChild(homeA);
  ul.appendChild(homeLi);

  articles.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.url;
    link.textContent = a.title;
    li.appendChild(link);
    ul.appendChild(li);
  });
}

function renderCarousel(articles) {
  const container = document.getElementById('carousel-tiles');
  if (!container) return;
  container.innerHTML = '';
  const recent = articles.slice(0, 3);
  recent.forEach((a) => {
    const tile = document.createElement('a');
    tile.className = 'tile';
    tile.href = a.url;

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = a.title;

    const date = document.createElement('div');
    date.className = 'tile-date';
    date.textContent = a.dateText || new Date(a.dateISO).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const snippet = document.createElement('div');
    snippet.className = 'tile-snippet';
    snippet.textContent = '';

    tile.appendChild(title);
    tile.appendChild(date);
    tile.appendChild(snippet);
    container.appendChild(tile);
  });
}

