import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Polygon from '../src/ol/geom/Polygon.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {fromLonLat, getPointResolution} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

// ---------- Pattern textures ----------

// 16x16 checkerboard (red / blue)
function createCheckerboard() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < 16; y += 8) {
    for (let x = 0; x < 16; x += 8) {
      ctx.fillStyle = (x + y) % 16 === 0 ? '#e74c3c' : '#3498db';
      ctx.fillRect(x, y, 8, 8);
    }
  }
  return canvas.toDataURL('image/png');
}

// 16x16 diagonal stripes (green / white)
function createStripes() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#27ae60';
  for (let i = -16; i < 32; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 16);
    ctx.lineTo(i + 12, 16);
    ctx.lineTo(i - 4, 0);
    ctx.fill();
  }
  return canvas.toDataURL('image/png');
}

// 16x16 dots (orange on dark)
function createDots() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(8, 8, 4, 0, 2 * Math.PI);
  ctx.fill();
  return canvas.toDataURL('image/png');
}

// ---------- Geometry ----------

// Create polygons at Amsterdam, approximately 50 x 50 meters each.
// At zoom 22 in EPSG:3857, these coordinates produce pixel positions
// around ~250 million — well beyond float32 precision (~7 digits).
const center = fromLonLat([4.9, 52.37]); // Amsterdam
const half = 25; // 25 meters

function makeSquare(cx, cy) {
  return new Polygon([
    [
      [cx - half, cy - half],
      [cx + half, cy - half],
      [cx + half, cy + half],
      [cx - half, cy + half],
      [cx - half, cy - half],
    ],
  ]);
}

const checkerFeature = new Feature({
  geometry: makeSquare(center[0] - 30, center[1] + 30),
  name: 'Checkerboard',
});
const stripeFeature = new Feature({
  geometry: makeSquare(center[0] + 30, center[1] + 30),
  name: 'Stripes',
});
const dotFeature = new Feature({
  geometry: makeSquare(center[0], center[1] - 30),
  name: 'Dots',
});

// ---------- Layers ----------

const checkerLayer = new WebGLVectorLayer({
  source: new VectorSource({features: [checkerFeature]}),
  style: {
    'fill-pattern-src': createCheckerboard(),
    'stroke-color': '#e74c3c',
    'stroke-width': 2,
  },
});

const stripeLayer = new WebGLVectorLayer({
  source: new VectorSource({features: [stripeFeature]}),
  style: {
    'fill-pattern-src': createStripes(),
    'stroke-color': '#27ae60',
    'stroke-width': 2,
  },
});

const dotLayer = new WebGLVectorLayer({
  source: new VectorSource({features: [dotFeature]}),
  style: {
    'fill-pattern-src': createDots(),
    'stroke-color': '#f39c12',
    'stroke-width': 2,
  },
});

// ---------- Map ----------

const view = new View({
  center: center,
  zoom: 19,
  maxZoom: 28,
  projection: 'EPSG:3857',
});

const map = new Map({
  layers: [new TileLayer({source: new OSM()}), checkerLayer, stripeLayer, dotLayer],
  target: 'map',
  view: view,
});

// ---------- Info display ----------

const zoomDisplay = document.getElementById('zoom-display');
const pixelDisplay = document.getElementById('pixel-display');

function updateInfo() {
  const zoom = view.getZoom();
  const resolution = view.getResolution();
  const viewCenter = view.getCenter();

  // Approximate pixel position of the view center from world origin.
  // At zoom 22 this will be ~250 million, showing why float32 fails.
  const pixelSize =
    getPointResolution('EPSG:3857', resolution, viewCenter) / resolution;
  const approxPixels = Math.abs(viewCenter[0]) / resolution / pixelSize;

  zoomDisplay.textContent = `Zoom: ${zoom.toFixed(1)}`;
  pixelDisplay.textContent = ` | Approx pixel position: ${approxPixels.toExponential(2)}`;
}

view.on('change:resolution', updateInfo);
view.on('change:center', updateInfo);
updateInfo();
