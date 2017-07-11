const path = require('path');
const test = require('tape');
const OSRM = require('osrm');
const area = require('@turf/area');
const intersect = require('@turf/intersect');
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


// For argument array intervals: [5, 10, 15, 20]
// Gives: [ [5,10], [5,15], [5,20], [10,15], [10,20], [15,20] ]
const testPairs = options.intervals
  .map(i => ({ head: i, tail: options.intervals.filter(x => x > i) }))
  .map(z => z.tail.map(t => [z.head, t]))
  .reduce((x, y) => x.concat(y), []);


test('deintersected isochrone', (t) => {
  t.plan(points.length * (1 + testPairs.length));
  points.forEach(point =>
    isochrone(point, Object.assign({}, options, { deintersect: true }))
      .then((geojson) => {
        const errors = geojsonhint.hint(geojson);
        if (errors.length > 0) {
          errors.forEach(error => t.comment(error.message));
          t.fail('Invalid GeoJSON');
        } else {
          t.pass('Valid GeoJSON');
        }
        // Gives { interval1: isochrone1, interval2: isochrone2, ... }
        const isochrones = options.intervals.reduce((acc, interval) => (
          Object.assign({}, acc, {
            [interval]: geojson.features
              .find(iso => iso.properties.time === interval)
          })), {}
        );
        // test that every smaller isochrone is contained by a larger one
        testPairs.forEach((minutePair) => {
          const [minSmall, minLarge] = minutePair;
          const [small, large] = [isochrones[minSmall], isochrones[minLarge]];
          const intersection = intersect(small, large);
          const areaIntersection = intersection ? area(intersection) : 0;
          // assert that the small isochrone overlaps over 90% with the large
          if (areaIntersection < 1e-7) {
            t.pass(`Isochrone ${minSmall} does not intersect ${minLarge}`);
          } else {
            t.fail(`Isochrone ${minSmall} intersects with ${minLarge}`);
          }
        });
      })
      .catch(error => t.error(error, 'No error'))
  );
});


test('isochrone', (t) => {
  t.plan(points.length * (1 + testPairs.length));
  points.forEach(point =>
    isochrone(point, Object.assign({}, options, { deintersect: false }))
      .then((geojson) => {
        const errors = geojsonhint.hint(geojson);
        if (errors.length > 0) {
          errors.forEach(error => t.comment(error.message));
          t.fail('Invalid GeoJSON');
        } else {
          t.pass('Valid GeoJSON');
        }
        // Gives { interval1: isochrone1, interval2: isochrone2, ... }
        const isochrones = options.intervals.reduce((acc, interval) => (
          Object.assign({}, acc, {
            [interval]: geojson.features
              .find(iso => iso.properties.time === interval)
          })), {}
        );
        // test that every smaller isochrone is contained by a larger one
        testPairs.forEach((minutePair) => {
          const [minSmall, minLarge] = minutePair;
          const [small, large] = [isochrones[minSmall], isochrones[minLarge]];
          const intersection = intersect(small, large);
          const areaIntersection = intersection ? area(intersection) : 0;
          // assert that the small isochrone overlaps over 90% with the large
          if ((areaIntersection / area(small)) > 0.9) {
            t.pass(`Isochrone ${minSmall} is contained in ${minLarge}`);
          } else {
            t.fail(`Isochrone ${minSmall} is not contained in ${minLarge}`);
          }
        });
      })
      .catch(error => t.error(error, 'No error'))
  );
});
