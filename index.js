const buffer = require('@turf/buffer');
const concaveman = require('concaveman');
const pointGrid = require('@turf/point-grid');
const rewind = require('geojson-rewind');

const makeGrid = (startPoint, options) => {
  const point = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: startPoint
    }
  };

  const buffered = buffer(point, options.radius, options.unit);
  const grid = pointGrid(buffered, options.cellSize, options.units);

  return grid.features.map(feature => feature.geometry.coordinates);
};

const groupByInterval = (destinations, intervals, travelTime) => {
  const intervalGroups = intervals.reduce((acc, interval) =>
    Object.assign({}, acc, { [interval]: [] })
  , {});

  const pointsByInterval = travelTime.reduce((acc, time, index) => {
    const timem = Math.round(time / 60);
    const ceil = intervals.find(interval => timem <= interval);
    if (ceil) {
      acc[ceil].push(destinations[index].location);
    }
    return acc;
  }, intervalGroups);

  return pointsByInterval;
};

const makePolygon = (points, interval, options) => {
  const concave = concaveman(points, options.concavity, options.lengthThreshold);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [concave]
    },
    properties: {
      time: parseFloat(interval)
    }
  };
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
 * @name isochrone
 * @param {Array.<float>} startPoint start point [lng, lat]
 * @param {Object} options object
 * @param {Object} options.osrm - [OSRM](https://github.com/Project-OSRM/osrm-backend) instance
 * @param {number} options.radius - distance to draw the buffer as in
 * [@turf/buffer](https://github.com/Turfjs/turf/tree/master/packages/turf-buffer)
 * @param {number} options.cellSize - the distance across each cell as in
 * [@turf/point-grid](https://github.com/Turfjs/turf/tree/master/packages/turf-point-grid)
 * @param {Array.<number>} options.intervals - intervals for isochrones in minutes
 * @param {number} [options.concavity=2] - relative measure of concavity as in
 * [concaveman](https://github.com/mapbox/concaveman)
 * @param {number} [options.lengthThreshold=0] - length threshold as in
 * [concaveman](https://github.com/mapbox/concaveman)
 * @param {string} [options.units='kilometers'] - any of the options supported by turf units
 * @returns {Promise} GeoJSON FeatureCollection of Polygons when resolved
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

        const features = makePolygons(pointsByInterval, options);
        const featureCollection = rewind({ type: 'FeatureCollection', features });
        resolve(featureCollection);
      } catch (e) {
        reject(e);
      }
    });
  });
};

module.exports = isochrone;
