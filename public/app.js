const $ = s => document.querySelector(s);
const S = { section: 'Jobs', cat: 'All', q: '', closed: false };
const today = new Date().toISOString().slice(0, 10);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const link = s => esc(s).replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, e => `<a href="mailto:${e}">${e}</a>`);
const day = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
let items = [];

function status(j) {
  if (!j.closes) return j.section === 'Jobs' ? ['none', 'No closing date listed', ''] : ['none', '', ''];
  if (j.closes < today) return ['closed', `Closed ${day(j.closes)}`, ''];
  const left = Math.round((new Date(j.closes) - new Date(today)) / 864e5);
  return ['open', left <= 7 ? `${left === 0 ? 'Closes today' : left + (left === 1 ? ' day left' : ' days left')}` : `Closes ${day(j.closes)}`, left <= 7 ? 'soon' : ''];
}

function render() {
  const inSection = items.filter(j => j.section === S.section);
  const cats = ['All', ...new Set(inSection.map(j => j.category))];
  if (!cats.includes(S.cat)) S.cat = 'All';
  $('#chips').innerHTML = cats.map(c => `<button aria-pressed="${c === S.cat}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  $('#tabs').innerHTML = ['Jobs', 'Scholarships'].map(t => `<button role="tab" aria-selected="${t === S.section}" data-t="${t}">${t}</button>`).join('');
  $('.check').hidden = S.section !== 'Jobs';
  const q = S.q.toLowerCase();
  const rows = inSection
    .filter(j => (S.cat === 'All' || j.category === S.cat) && (`${j.title} ${j.details}`.toLowerCase().includes(q)))
    .filter(j => S.section !== 'Jobs' || S.closed || status(j)[0] !== 'closed')
    .sort((a, b) => (status(a)[0] === 'closed') - (status(b)[0] === 'closed') || (a.closes || '9') .localeCompare(b.closes || '9'));
  $('#count').textContent = `${rows.length} ${S.section.toLowerCase()} shown`;
  $('#list').innerHTML = rows.length ? rows.map(j => {
    const [s, label, cls] = status(j);
    return `<article data-s="${s}" class="${cls}"><h2><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a></h2>
<p class="meta">${esc(j.category)}${label ? ` · <span class="status">${label}</span>` : ''}</p><p class="d">${link(j.details)}</p></article>`;
  }).join('') : `<div class="empty"><p>No ${S.section.toLowerCase()} match${S.section === 'Jobs' && !S.closed ? ' that are still open' : ''}.</p>${S.section === 'Jobs' && !S.closed ? '<button id="showc">Show closed jobs</button>' : ''}</div>`;
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.t) { S.section = t.dataset.t; S.cat = 'All'; render(); }
  else if (t.dataset.c) { S.cat = t.dataset.c; render(); }
  else if (t.id === 'showc') { $('#closed').checked = S.closed = true; render(); }
});
$('#q').addEventListener('input', e => { S.q = e.target.value; render(); });
$('#closed').addEventListener('change', e => { S.closed = e.target.checked; render(); });

fetch('jobs.json').then(r => r.json()).then(d => {
  items = d.items;
  $('#updated').textContent = `Listings last built ${day(d.updated.slice(0, 10))}. Always confirm details on the employer's or provider's page before applying.`;
  render();
}).catch(() => { $('#list').innerHTML = '<div class="empty"><p>Listings could not be loaded. Refresh the page to try again.</p></div>'; });
