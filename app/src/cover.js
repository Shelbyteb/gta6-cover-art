// Vice Sunset cover engine: draws a multi-panel poster cover onto a canvas.
// Everything here is original art made with canvas primitives: a neon sunset sky,
// a sun disc, palm silhouettes, photo panels with a warm grade, and bold Anton
// lettering. No Rockstar artwork, logo or font is used anywhere.

export const COVER_SIZES = {
  square: { label: '1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: '1080 x 1350', width: 1080, height: 1350 },
  wide: { label: '1920 x 1080', width: 1920, height: 1080 },
};

export const LAYOUTS = {
  poster: { label: 'Poster grid', panels: 4 },
  diagonal: { label: 'Diagonal slices', panels: 3 },
  strip: { label: 'Film strip', panels: 3 },
};

// Default crop per panel slot, tuned per layout so a fresh cover already looks
// composed: each panel frames a different part of its photo.
export const PANEL_CROPS = {
  poster: [
    { zoom: 1, ox: 0, oy: -0.08 },
    { zoom: 1.55, ox: 0.18, oy: -0.12 },
    { zoom: 1, ox: 0, oy: 0.9 },
    { zoom: 1.12, ox: 0.12, oy: 0.14 },
  ],
  strip: [
    { zoom: 1, ox: 0, oy: -0.08 },
    { zoom: 1.55, ox: 0.18, oy: -0.12 },
    { zoom: 1, ox: 0, oy: 0.9 },
  ],
  diagonal: [
    { zoom: 1.1, ox: 0.15, oy: -0.05 },
    { zoom: 1.35, ox: 0, oy: 0 },
    { zoom: 1.25, ox: -0.1, oy: 0 },
  ],
};
export const DEFAULT_PANEL_CROPS = PANEL_CROPS.poster;

/**
 * Panel shapes for a layout, in canvas pixels. Each shape carries its polygon
 * (for clipping and hit-testing) and its bounding box (for fitting the photo).
 */
export function layoutPanelShapes(layout, width, height) {
  const margin = Math.round(Math.min(width, height) * 0.028);
  const areaX = margin;
  const areaY = margin;
  const areaW = width - margin * 2;
  const areaH = Math.round(height * 0.775) - margin;
  const gap = Math.max(4, Math.round(Math.min(width, height) * 0.012));
  const rect = (x, y, w, h) => ({
    poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
    x, y, w, h,
  });
  const boxed = (shape) => {
    const xs = shape.poly.map((p) => p[0]);
    const ys = shape.poly.map((p) => p[1]);
    shape.x = Math.min(...xs);
    shape.y = Math.min(...ys);
    shape.w = Math.max(...xs) - shape.x;
    shape.h = Math.max(...ys) - shape.y;
    return shape;
  };

  if (layout === 'diagonal') {
    const slant = areaW * 0.1;
    const b1 = areaW * 0.36;
    const b2 = areaW * 0.7;
    return [
      boxed({ poly: [[areaX, areaY], [areaX + b1, areaY], [areaX + b1 - slant, areaY + areaH], [areaX, areaY + areaH]] }),
      boxed({ poly: [[areaX + b1, areaY], [areaX + b2, areaY], [areaX + b2 - slant, areaY + areaH], [areaX + b1 - slant, areaY + areaH]] }),
      boxed({ poly: [[areaX + b2, areaY], [areaX + areaW, areaY], [areaX + areaW, areaY + areaH], [areaX + b2 - slant, areaY + areaH]] }),
    ];
  }
  if (layout === 'strip') {
    const h0 = Math.round((areaH - gap * 2) * 0.44);
    const h1 = Math.round((areaH - gap * 2) * 0.28);
    const h2 = areaH - gap * 2 - h0 - h1;
    const inset = Math.round(areaW * 0.07);
    return [
      rect(areaX, areaY, areaW, h0),
      rect(areaX + inset, areaY + h0 + gap, areaW - inset * 2, h1),
      rect(areaX, areaY + h0 + h1 + gap * 2, areaW, h2),
    ];
  }
  // poster: one hero panel left, three stacked panels right.
  const heroW = Math.round(areaW * 0.6) - Math.floor(gap / 2);
  const colX = areaX + heroW + gap;
  const colW = areaX + areaW - colX;
  const sideH = Math.round((areaH - gap * 2) / 3);
  return [
    rect(areaX, areaY, heroW, areaH),
    rect(colX, areaY, colW, sideH),
    rect(colX, areaY + sideH + gap, colW, sideH),
    rect(colX, areaY + (sideH + gap) * 2, colW, areaH - (sideH + gap) * 2),
  ];
}

/** True when point (px, py) lies inside the polygon. */
export function pointInShape(shape, px, py) {
  const poly = shape.poly;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  noiseTile = tile;
  return tile;
}

/** A stylised palm silhouette: one curved trunk and fanning fronds. */
function drawPalm(ctx, baseX, baseY, palmH, lean) {
  const crownX = baseX + lean * palmH * 0.55;
  const crownY = baseY - palmH;
  ctx.save();
  ctx.strokeStyle = '#150722';
  ctx.fillStyle = '#150722';
  ctx.lineCap = 'round';
  // Trunk, tapering by stroking it in segments.
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const x0 = baseX + lean * palmH * 0.55 * t0 * t0 + Math.sin(t0 * 1.2) * palmH * 0.03;
    const y0 = baseY - palmH * t0;
    const x1 = baseX + lean * palmH * 0.55 * t1 * t1 + Math.sin(t1 * 1.2) * palmH * 0.03;
    const y1 = baseY - palmH * t1;
    ctx.lineWidth = Math.max(2, palmH * 0.055 * (1 - t0 * 0.6));
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  // Fronds: arcs that rise from the crown and droop at the tips.
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI * (0.08 + (0.84 * i) / (fronds - 1));
    const reach = palmH * (0.52 + 0.1 * Math.sin(i * 2.1));
    const tipX = crownX + Math.cos(a) * reach;
    const tipY = crownY - Math.sin(a) * reach * 0.55 + reach * 0.28;
    const ctrlX = crownX + Math.cos(a) * reach * 0.55;
    const ctrlY = crownY - Math.sin(a) * reach * 0.8;
    ctx.lineWidth = Math.max(2, palmH * 0.028);
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

/** Fits one photo into a panel box, honouring its zoom and pan offsets. */
function drawPanelPhoto(ctx, shape, photo, panel, sunset, neon) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const zoom = panel.zoom || 1;
  const scale = Math.max(shape.w / iw, shape.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = shape.x + (shape.w - dw) / 2 + (panel.ox || 0) * shape.w * 0.45;
  const dy = shape.y + (shape.h - dh) / 2 + (panel.oy || 0) * shape.h * 0.45;
  ctx.save();
  ctx.filter = `saturate(${(1.12 + neon * 0.25).toFixed(2)}) contrast(1.05) brightness(1.02)`;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  // Warm sunset grade, stronger toward the bottom of the panel.
  const grade = ctx.createLinearGradient(0, shape.y, 0, shape.y + shape.h);
  grade.addColorStop(0, `rgba(255, 170, 90, ${(0.05 + sunset * 0.1).toFixed(3)})`);
  grade.addColorStop(1, `rgba(235, 30, 125, ${(0.08 + sunset * 0.22).toFixed(3)})`);
  ctx.fillStyle = grade;
  ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
  if (neon > 0.05) {
    const neonWash = ctx.createLinearGradient(0, shape.y, 0, shape.y + shape.h);
    neonWash.addColorStop(0, `rgba(45, 220, 255, ${(neon * 0.1).toFixed(3)})`);
    neonWash.addColorStop(1, `rgba(255, 0, 160, ${(neon * 0.12).toFixed(3)})`);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = neonWash;
    ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Soft light from the top edge so panels read as one poster.
  const sheen = ctx.createLinearGradient(0, shape.y, 0, shape.y + shape.h * 0.14);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(shape.x, shape.y, shape.w, shape.h * 0.14);
}

function drawEmptyPanel(ctx, shape, index) {
  const fill = ctx.createLinearGradient(shape.x, shape.y, shape.x + shape.w, shape.y + shape.h);
  fill.addColorStop(0, '#3d1c60');
  fill.addColorStop(1, '#7c2a6e');
  ctx.fillStyle = fill;
  ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
  const numSize = Math.min(shape.w, shape.h) * 0.42;
  ctx.font = `${numSize}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillText(String(index + 1), shape.x + shape.w / 2, shape.y + shape.h / 2 - numSize * 0.18);
  ctx.font = `600 ${Math.max(11, Math.min(shape.w, shape.h) * 0.07)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText('ADD A PHOTO', shape.x + shape.w / 2, shape.y + shape.h / 2 + numSize * 0.42);
}

/**
 * Draws the whole cover. `state` carries layout, photos, per-panel crops,
 * caption, colours and grade. `photos` are HTMLImageElements (or null).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const margin = Math.round(Math.min(W, H) * 0.028);
  const sunset = (state.sunset ?? 70) / 100;
  const neon = (state.neon ?? 55) / 100;

  // Neon sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1c0f38');
  sky.addColorStop(0.45, '#6d2560');
  sky.addColorStop(0.78, '#c93a6e');
  sky.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const horizon = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.85);
  horizon.addColorStop(0, 'rgba(255, 120, 90, 0)');
  horizon.addColorStop(1, 'rgba(255, 170, 80, 0.35)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, H * 0.55, W, H * 0.3);

  // Sun disc, peeking out behind the panels.
  const sunR = Math.min(W, H) * 0.17;
  const sunX = W * 0.82;
  const sunY = H * 0.11;
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, '#ffe9a3');
  sun.addColorStop(0.55, '#ff8a5c');
  sun.addColorStop(1, 'rgba(255, 70, 120, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Photo panels.
  const shapes = layoutPanelShapes(state.layout, W, H);
  const border = Math.max(2, Math.min(W, H) * 0.004);
  shapes.forEach((shape, i) => {
    const panel = state.panels[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo != null ? state.photos[panel.photo] : null;
    ctx.save();
    ctx.beginPath();
    shape.poly.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.clip();
    if (photo) drawPanelPhoto(ctx, shape, photo, panel, sunset, neon);
    else drawEmptyPanel(ctx, shape, i);
    ctx.restore();
    ctx.beginPath();
    shape.poly.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.lineWidth = border;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.stroke();
  });

  // Diagonal gutters read as bright slices between the panels.
  if (state.layout === 'diagonal') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
    const areaW = W - margin * 2;
    const areaH = Math.round(H * 0.775) - margin;
    const slant = areaW * 0.1;
    [0.36, 0.7].forEach((f) => {
      ctx.beginPath();
      ctx.moveTo(margin + areaW * f, margin);
      ctx.lineTo(margin + areaW * f - slant, margin + areaH);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Palm silhouettes framing the bottom corners.
  if (state.palms !== false) {
    drawPalm(ctx, margin * 0.5, H - 2, H * 0.17, 0.4);
    drawPalm(ctx, W - margin * 0.5, H - 2, H * 0.15, -0.4);
  }

  // Caption band: neon divider, bold title, letterspaced subtitle.
  const bandY = H * 0.8;
  const bandH = H - margin - bandY;
  const divider = ctx.createLinearGradient(margin, 0, W - margin, 0);
  divider.addColorStop(0, '#ff2e88');
  divider.addColorStop(0.5, '#ffb347');
  divider.addColorStop(1, '#2ee6ff');
  ctx.fillStyle = divider;
  ctx.fillRect(margin, bandY - Math.max(2, H * 0.004), W - margin * 2, Math.max(2, H * 0.004));

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = Math.min(W * 0.105, bandH * 0.58) * (state.titleScale ?? 1);
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(title).width > W - margin * 2 - 24 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    ctx.save();
    ctx.translate(W / 2, bandY + bandH * 0.48);
    ctx.rotate(-0.02);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.85)';
    ctx.shadowBlur = size * 0.16;
    if (state.outline !== false) {
      ctx.lineWidth = Math.max(2, size / 14);
      ctx.strokeStyle = '#180826';
      ctx.lineJoin = 'round';
      ctx.strokeText(title, 0, 0);
    }
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (subtitle) {
    const subSize = Math.max(13, Math.min(W * 0.02, bandH * 0.17));
    ctx.save();
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.22)}px`; } catch { /* older canvas: ignore */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 217, 160, 0.95)';
    ctx.fillText(subtitle, W / 2, bandY + bandH * 0.85);
    ctx.restore();
  }

  // Film grain and vignette finish the grade.
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(8, 2, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 18, 0.36)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
