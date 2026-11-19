// Fixed scenes for screenshots: ?shot=cover shows the finished cover alone,
// ?shot=editor shows the editor with sample photos loaded. Query knobs:
// layout, size (square|portrait|wide), title, sub, p1, p2 (sample photo names),
// panels (comma list of photo indexes, e.g. 0,1,0,1). window.__shotReady is
// set once the scene is painted, so a screenshot driver can wait on it.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photoNames = [query.get('p1') ?? 'pier', query.get('p2') ?? 'boulevard'];
  const panelPhotos = (query.get('panels') ?? '')
    .split(',')
    .filter((s) => s !== '')
    .map((s) => Number(s));
  await api.setScene({
    layout: query.get('layout') ?? 'poster',
    sizeKey: query.get('size') ?? 'square',
    title: query.get('title') ?? 'VICE CITY NIGHTS',
    subtitle: query.get('sub') ?? 'OCEAN DRIVE AFTER DARK',
    photos: photoNames,
    panelPhotos: panelPhotos.length ? panelPhotos : undefined,
  });
  try { await document.fonts.load('100px Anton'); } catch { /* system font fallback */ }
  api.renderCover();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
