const deintersect = require('turf-deintersect');
const helpers = require('@turf/helpers');
const rewind = require('geojson-rewind');
const { makeGrid, groupByInterval, makePolygons } = require('./utils');

/**
 * Build isochrone using start point and options
 *
 * @param {Array.<float>} startPoint start point [lng, lat]
 * @param {Object} options object
 * @param {Object} options.osrm - [OSRM](https://github.com/Project-OSRM/osrm-backend) instance
 * @param {number} options.radius - distance to draw the buffer as in [@turf/buffer](https://github.com/Turfjs/turf/tree/master/packages/turf-buffer)
 * @param {number} options.cellSize - the distance across each cell as in [@turf/point-grid](https://github.com/Turfjs/turf/tree/master/packages/turf-point-grid)
 * @param {Array.<number>} options.intervals - intervals for isochrones in minutes
 * @param {boolean} options.deintersect - whether or not to deintersect the isochrones.
 * If this is true, then the isochrones will be mutually exclusive
 * @param {number} [options.concavity=2] - relative measure of concavity as in [concaveman](https://github.com/mapbox/concaveman)
 * @param {number} [options.lengthThreshold=0] - length threshold as in [concaveman](https://github.com/mapbox/concaveman)
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
 *   intervals: [5, 10, 15]
 * };
 *
 * isochrone(startPoint, options)
 *   .then((geojson) => {
 *     console.log(JSON.stringify(geojson));
 *   });
 */
const isochrone = (startPoint, options) =>
  new Promise((resolve, reject) => {
    try {
      const endPoints = makeGrid(startPoint, options);
      const coordinates = [startPoint].concat(endPoints);
      options.osrm.table({ sources: [0], coordinates }, (error, table) => {
        if (error) {
          reject(error);
        }

        const travelTime = table.durations[0] || [];

        const pointsByInterval = groupByInterval(table.destinations, options.intervals, travelTime);

        const polygons = makePolygons(pointsByInterval, options);

        const features = options.deintersect ? deintersect(polygons) : polygons;
        const featureCollection = rewind(helpers.featureCollection(features));

        resolve(featureCollection);
      });
    } catch (error) {
      reject(error);
    }
  });

module.exports = isochrone;
