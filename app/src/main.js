// Vice Sunset Cover Maker: wires the editor. Pick photos, choose a layout,
// crop each panel by dragging or with the sliders, write the caption, pick a
// post size and export a PNG. Photos are read on this machine and never leave it.
import { COVER_SIZES, LAYOUTS, PANEL_CROPS, drawCover, layoutPanelShapes, pointInShape } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelBar = document.getElementById('panelbar');
const SAMPLE_PHOTOS = ['boulevard', 'pier'];

/** Fresh editor state: two sample photos already loaded so the cover is alive. */
function freshState() {
  return {
    layout: 'poster',
    sizeKey: 'square',
    title: 'VICE CITY NIGHTS',
    subtitle: 'OCEAN DRIVE AFTER DARK',
    titleColor: '#ffffff',
    titleScale: 1,
    outline: true,
    sunset: 70,
    neon: 55,
    grain: true,
    palms: true,
    photos: [null, null, null],
    panels: [],
    selectedPanel: 0,
  };
}

const state = freshState();

function buildPanels(layout, keep) {
  const count = LAYOUTS[layout].panels;
  const crops = PANEL_CROPS[layout] || PANEL_CROPS.poster;
  const panels = [];
  for (let i = 0; i < count; i++) {
    const old = keep && keep[i];
    const crop = crops[i % crops.length];
    panels.push({
      photo: old ? old.photo : i === 0 ? 0 : i === 1 ? 1 : 0,
      zoom: old ? old.zoom : crop.zoom ?? 1,
      ox: old ? old.ox : crop.ox,
      oy: old ? old.oy : crop.oy,
    });
  }
  return panels;
}
state.panels = buildPanels(state.layout);

function sizeDims() {
  return COVER_SIZES[state.sizeKey];
}

/** Redraws the preview canvas at the chosen post size. */
export function renderCover() {
  const { width, height } = sizeDims();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(canvas, state);
  renderPanelBar();
}

function renderPanelBar() {
  panelBar.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-chip' + (i === state.selectedPanel ? ' selected' : '');
    btn.textContent = `Panel ${i + 1} · ${panel.photo == null ? 'empty' : 'Photo ' + (panel.photo + 1)}`;
    btn.addEventListener('click', () => {
      state.selectedPanel = i;
      renderCover();
      syncPanelControls();
    });
    panelBar.appendChild(btn);
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadFileIntoSlot(slot, file) {
  const img = await loadImage(URL.createObjectURL(file));
  state.photos[slot] = img;
  document.getElementById(`thumb-${slot}`).src = img.src;
  document.getElementById(`thumb-${slot}`).hidden = false;
  state.panels.forEach((panel) => {
    if (panel.photo == null) panel.photo = slot;
  });
  renderCover();
  syncPanelControls();
}

async function loadSampleIntoSlot(slot, name) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos[slot] = img;
  document.getElementById(`thumb-${slot}`).src = `samples/${name}.jpg`;
  document.getElementById(`thumb-${slot}`).hidden = false;
  renderCover();
  syncPanelControls();
}

function fillAllPanels(slot) {
  state.panels.forEach((panel) => { panel.photo = slot; });
  renderCover();
  syncPanelControls();
  statusEl.textContent = `Photo ${slot + 1} now fills every panel.`;
}

/** Syncs the selected-panel controls (photo, zoom, pan) with the state. */
function syncPanelControls() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  document.getElementById('panel-label').textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length}`;
  const select = document.getElementById('panel-photo');
  select.value = panel.photo == null ? '' : String(panel.photo);
  document.getElementById('panel-zoom').value = panel.zoom;
  document.getElementById('panel-zoom-out').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('panel-ox').value = panel.ox;
  document.getElementById('panel-oy').value = panel.oy;
}

function bindControls() {
  // Photo slots.
  for (let slot = 0; slot < 3; slot++) {
    document.getElementById(`photo-${slot}`).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadFileIntoSlot(slot, file).catch(() => { statusEl.textContent = 'That file could not be read as a photo.'; });
    });
    document.getElementById(`sample-${slot}`).addEventListener('click', () => {
      loadSampleIntoSlot(slot, SAMPLE_PHOTOS[slot % SAMPLE_PHOTOS.length]).catch(() => {});
    });
    document.getElementById(`fill-${slot}`).addEventListener('click', () => fillAllPanels(slot));
  }

  // Layout picker.
  document.querySelectorAll('input[name="layout"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.layout = radio.value;
      state.panels = buildPanels(state.layout, state.panels);
      state.selectedPanel = 0;
      renderCover();
      syncPanelControls();
    });
  });

  // Selected panel controls.
  document.getElementById('panel-photo').addEventListener('change', (e) => {
    state.panels[state.selectedPanel].photo = e.target.value === '' ? null : Number(e.target.value);
    renderCover();
    syncPanelControls();
  });
  document.getElementById('panel-zoom').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].zoom = Number(e.target.value);
    renderCover();
    document.getElementById('panel-zoom-out').textContent = `${Math.round(state.panels[state.selectedPanel].zoom * 100)}%`;
  });
  document.getElementById('panel-ox').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].ox = Number(e.target.value);
    renderCover();
  });
  document.getElementById('panel-oy').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].oy = Number(e.target.value);
    renderCover();
  });

  // Caption.
  document.getElementById('caption').addEventListener('input', (e) => { state.title = e.target.value; renderCover(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderCover(); });
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.titleColor = btn.dataset.color;
      document.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('selected', b === btn));
      renderCover();
    });
  });
  document.getElementById('title-size').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    renderCover();
  });
  document.getElementById('outline').addEventListener('change', (e) => {
    state.outline = e.target.checked;
    renderCover();
  });

  // Look: grade and finishing touches.
  document.getElementById('sunset').addEventListener('input', (e) => { state.sunset = Number(e.target.value); renderCover(); });
  document.getElementById('neon').addEventListener('input', (e) => { state.neon = Number(e.target.value); renderCover(); });
  document.getElementById('palms').addEventListener('change', (e) => { state.palms = e.target.checked; renderCover(); });
  document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; renderCover(); });

  // Post size.
  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sizeKey = btn.dataset.size;
      document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('selected', b === btn));
      renderCover();
    });
  });

  // Export: render the exact-size PNG and download it.
  document.getElementById('export').addEventListener('click', () => {
    const { width, height } = sizeDims();
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    drawCover(off, state);
    off.toBlob((blob) => {
      if (!blob) {
        statusEl.textContent = 'Export failed — please try again.';
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-sunset-cover-${width}x${height}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      statusEl.textContent = `Saved vice-sunset-cover-${width}x${height}.png`;
    }, 'image/png');
  });

  // Click a panel on the preview to select it; drag inside it to pan the photo.
  let drag = null;
  const shapeAt = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const shapes = layoutPanelShapes(state.layout, canvas.width, canvas.height);
    return { x, y, index: shapes.findIndex((s) => pointInShape(s, x, y)), shapes };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const hit = shapeAt(e);
    if (hit.index < 0) return;
    state.selectedPanel = hit.index;
    syncPanelControls();
    renderCover();
    drag = { x: hit.x, y: hit.y, shape: hit.shapes[hit.index], panel: state.panels[hit.index] };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    drag.panel.ox = Math.max(-1, Math.min(1, drag.panel.ox + ((x - drag.x) / drag.shape.w) * 2.2));
    drag.panel.oy = Math.max(-1, Math.min(1, drag.panel.oy + ((y - drag.y) / drag.shape.h) * 2.2));
    drag.x = x;
    drag.y = y;
    renderCover();
    syncPanelControls();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

// Shot scenes for screenshots: fixed layouts, sample photos and captions.
window.__vice = {
  state,
  renderCover,
  async loadSample(name) {
    return loadImage(`samples/${name}.jpg`);
  },
  async setScene(scene) {
    if (scene.layout) {
      state.layout = scene.layout;
      document.querySelector(`input[name="layout"][value="${scene.layout}"]`).checked = true;
    }
    if (scene.sizeKey) {
      state.sizeKey = scene.sizeKey;
      document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('selected', b.dataset.size === scene.sizeKey));
    }
    if (scene.title != null) { state.title = scene.title; document.getElementById('caption').value = scene.title; }
    if (scene.subtitle != null) { state.subtitle = scene.subtitle; document.getElementById('subtitle').value = scene.subtitle; }
    if (scene.photos) {
      for (let i = 0; i < scene.photos.length; i++) {
        const img = await loadImage(`samples/${scene.photos[i]}.jpg`);
        state.photos[i] = img;
        document.getElementById(`thumb-${i}`).src = `samples/${scene.photos[i]}.jpg`;
        document.getElementById(`thumb-${i}`).hidden = false;
      }
    }
    state.panels = buildPanels(state.layout);
    if (scene.panelPhotos) {
      scene.panelPhotos.forEach((photo, i) => {
        if (state.panels[i]) state.panels[i].photo = photo;
      });
    }
    if (scene.sunset != null) { state.sunset = scene.sunset; document.getElementById('sunset').value = scene.sunset; }
    if (scene.neon != null) { state.neon = scene.neon; document.getElementById('neon').value = scene.neon; }
    state.selectedPanel = 0;
    renderCover();
    syncPanelControls();
  },
};

bindControls();
syncPanelControls();

// Preload the two free sample photos so the first cover is already alive;
// the user replaces them with their own photos from their machine.
Promise.all([loadSampleIntoSlot(0, 'boulevard'), loadSampleIntoSlot(1, 'pier')])
  .catch(() => {})
  .finally(() => {
    document.fonts.load('100px Anton').catch(() => {}).finally(() => renderCover());
    document.fonts.ready.then(() => renderCover()).catch(() => {});
  });

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), window.__vice);
} else {
  renderCover();
}
