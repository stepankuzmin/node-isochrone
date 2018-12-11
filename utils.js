const os = require('os');
const cheapRuler = require('cheap-ruler');
const concaveman = require('concaveman');
const deintersect = require('turf-deintersect');
const helpers = require('@turf/helpers');
const pointGrid = require('@turf/point-grid').default;
const rewind = require('geojson-rewind');

const makeGrid = (startPoint, options) => {
  const ruler = cheapRuler(startPoint[0], options.unit);
  const bboxGrid = ruler.bufferPoint(startPoint, options.radius);
  const grid = pointGrid(bboxGrid, options.cellSize, { units: options.units });
  return grid.features.map(feature => feature.geometry.coordinates);
};

const getDistanceMatrix = (osrm, startPoint, coordinates) =>
  new Promise((resolve, reject) => {
    // add startPoint
    const startPointIndex = coordinates.push(startPoint);

    osrm.table({ sources: [startPointIndex - 1], coordinates }, (error, table) => {
      if (error) reject(error);

      const durations = table.durations[0];
      const destinations = table.destinations.map((destination, index) => ({
        location: destination.location,
        duration: durations[index]
      }));

      // remove startPoint
      destinations.pop();

      resolve(destinations);
    });
  });

const intoChunks = (array, chunks) => {
  const results = [];
  const chuckSize = Math.ceil(array.length / chunks);

  for (let i = 0; i < chunks; i += 1) {
    results.push(array.splice(0, chuckSize));
  }

  return results;
};

const flatten = array => array.reduce((acc, subarray) => acc.concat(subarray), []);

const makeDistanceMatrix = (startPoint, destinations, options) => {
  const chunks = options.chunksCount || os.cpus().length;

  const destinationChunks = intoChunks(destinations, chunks);

  const distanceMatrixPromises = destinationChunks.map(destinationChunk =>
    getDistanceMatrix(options.osrm, startPoint, destinationChunk)
  );

  return Promise.all(distanceMatrixPromises).then(flatten);
};

const groupByIntervals = (distanceMatrix, intervals) => {
  const initialValue = intervals.reduce((acc, interval) => {
    acc[interval] = [];
    return acc;
  }, {});

  return distanceMatrix.reduce((acc, { location, duration }) => {
    const interval = intervals.find(i => duration <= i * 60);
    if (interval) {
      acc[interval].push(location);
    }

    return acc;
  }, initialValue);
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

const makeIsochrone = (distanceMatrix, options) => {
  const pointsByInterval = groupByIntervals(distanceMatrix, options.intervals);
  const polygons = makePolygons(pointsByInterval, options);
  const features = options.deintersect ? deintersect(polygons) : polygons;
  const featureCollection = rewind(helpers.featureCollection(features));
  return featureCollection;
};

module.exports = { makeGrid, makeDistanceMatrix, makeIsochrone };
