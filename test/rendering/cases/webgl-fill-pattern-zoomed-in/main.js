import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

// A polygon centered around EPSG:3857 coordinates typical of central Europe.
// At zoom 23, these world coordinates produce pixel values in the ~60 billion range,
// which would cause float32 precision loss in the shader without Dekker splitting.
const cx = 1113195;
const cy = 6446275;
// At zoom 23 the resolution is ~0.019 m/px, so 256px viewport spans ~4.8m.
// Use a large polygon that fills most of the viewport.
const d = 2;

const polygon = new Feature({
  geometry: new Polygon([
    [
      [cx - d, cy - d],
      [cx + d, cy - d],
      [cx + d, cy + d],
      [cx - d, cy + d],
      [cx - d, cy - d],
    ],
  ]),
});

// Create a simple 16x16 checkerboard pattern (red and blue).
// If Dekker splitting works, we should see a clean, tiled checkerboard.
// Without it, the pattern would appear as random noise due to precision loss.
const canvas = document.createElement('canvas');
canvas.width = 16;
canvas.height = 16;
const ctx = canvas.getContext('2d');
for (let y = 0; y < 16; y += 8) {
  for (let x = 0; x < 16; x += 8) {
    ctx.fillStyle = (x + y) % 16 === 0 ? 'red' : 'blue';
    ctx.fillRect(x, y, 8, 8);
  }
}

const layer = new WebGLVectorLayer({
  style: {
    'fill-pattern-src': canvas.toDataURL('image/png'),
  },
  source: new VectorSource({
    features: [polygon],
  }),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [cx, cy],
    zoom: 23,
    projection: 'EPSG:3857',
  }),
});

map.once('rendercomplete', () => {
  render({
    message:
      'renders fill pattern correctly at zoom 23 (high precision via Dekker splitting)',
    tolerance: 0.01,
  });
});
