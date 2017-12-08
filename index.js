const bbox = require('@turf/bbox');
const concaveman = require('concaveman');
const deintersect = require('turf-deintersect');
const destination = require('@turf/destination');
const helpers = require('@turf/helpers');
const pointGrid = require('@turf/point-grid');
const rewind = require('geojson-rewind');

const makeGrid = (startPoint, options) => {
  const point = helpers.point(startPoint);

  const spokes = helpers.featureCollection([
    destination(point, options.radius, 180, options.unit),
    destination(point, options.radius, 0, options.unit),
    destination(point, options.radius, 90, options.unit),
    destination(point, options.radius, -90, options.unit)
  ]);

  const bboxGrid = bbox(spokes);
  const grid = pointGrid(bboxGrid, options.cellSize, { units: options.units });

  return grid.features.map(feature => feature.geometry.coordinates);
};

const groupByInterval = (destinations, intervals, travelTime) => {
  const groups = {};
  intervals.forEach((interval) => {
    const points = destinations
      .filter((point, index) => (
        travelTime[index] !== null && travelTime[index] <= interval * 60))
      .map(d => d.location);

    groups[interval] = points;
  });
  return groups;
};

const makePolygon = (points, interval, options) => {
  const concave = concaveman(points, options.concavity, options.lengthThreshold);
  return helpers.polygon([concave], { time: parseFloat(interval) });
};

const makePolygons = (pointsByInterval, options) =>
  Object.keys(pointsByInterval).reduce((acc, interval) => {
    const points = pointsByInterval[interval];
    if (points.length >= 3) {
      acc.push(makePolygon(points, interval, options));
    }
    return acc;
  }, []);

/**
 * Build isochrone using start point and options
 *
 * @param {Array.<float>} startPoint start point [lng, lat]
 * @param {Object} options object
 * @param {Object} options.osrm - [OSRM](https://github.com/Project-OSRM/osrm-backend) instance
 * @param {number} options.radius - distance to draw the buffer as in
 * [@turf/buffer](https://github.com/Turfjs/turf/tree/master/packages/turf-buffer)
 * @param {number} options.cellSize - the distance across each cell as in
 * [@turf/point-grid](https://github.com/Turfjs/turf/tree/master/packages/turf-point-grid)
 * @param {Array.<number>} options.intervals - intervals for isochrones in minutes
 * @param {boolean} options.deintersect - whether or not to deintersect the isochrones.
 * If this is true, then the isochrones will be mutually exclusive
 * @param {number} [options.concavity=2] - relative measure of concavity as in
 * [concaveman](https://github.com/mapbox/concaveman)
 * @param {number} [options.lengthThreshold=0] - length threshold as in
 * [concaveman](https://github.com/mapbox/concaveman)
 * @param {string} [options.units='kilometers'] - any of the options supported by turf units
 * @returns {Promise} GeoJSON FeatureCollection of Polygons when resolved
 *
 * @example
 * const OSRM = require('osrm');
 * const isochrone = require('isochrone');
 *
 * const osrm = new OSRM({ path: './monaco.osrm' });
 * const startPoint = [7.41337, 43.72956];
 *
 * const options = {
 *   osrm,
 *   radius: 2,
 *   cellSize: 0.1,
 *   intervals: [5, 10, 15],
 *   deintersect: true
 * };
 *
 * isochrone(startPoint, options)
 *   .then((geojson) => {
 *     console.log(JSON.stringify(geojson));
 *   });
 */
const isochrone = (startPoint, options) => {
  const endPoints = makeGrid(startPoint, options);
  const coordinates = [startPoint].concat(endPoints);

  return new Promise((resolve, reject) => {
    options.osrm.table({ sources: [0], coordinates }, (error, table) => {
      if (error) {
        reject(error);
      }

      try {
        const travelTime = table.durations[0] || [];

        const pointsByInterval = groupByInterval(table.destinations, options.intervals, travelTime);
        const polygons = makePolygons(pointsByInterval, options);

        const features = options.deintersect ? deintersect(polygons) : polygons;
        const featureCollection = rewind(helpers.featureCollection(features));

        resolve(featureCollection);
      } catch (e) {
        reject(e);
      }
    });
  });
};

module.exports = isochrone;
