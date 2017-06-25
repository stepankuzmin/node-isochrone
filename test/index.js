const path = require('path');
const test = require('tape');
const OSRM = require('osrm');
const geojsonhint = require('@mapbox/geojsonhint');
const isochrone = require('../index');

const points = [
  [7.41337, 43.72956],
  [7.41546, 43.73077],
  [7.41862, 43.73216]
];

const osrmPath = path.join(__dirname, './data/monaco.osrm');
const osrm = new OSRM({ path: osrmPath });

const options = {
  osrm,
  radius: 2,
  cellSize: 0.1,
  concavity: 2,
  intervals: [5, 10, 15],
  lengthThreshold: 0,
  units: 'kilometers'
};

test('isochrone', (t) => {
  t.plan(3);
  points.forEach(point =>
    isochrone(point, options)
      .then((geojson) => {
        const errors = geojsonhint.hint(geojson);
        if (errors.length > 0) {
          errors.forEach(error => t.comment(error.message));
          t.fail('Invalid GeoJSON');
        } else {
          t.pass('Valid GeoJSON');
        }
      })
      .catch(error => t.error(error, 'No error'))
  );
});
