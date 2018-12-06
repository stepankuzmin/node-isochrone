const bbox = require('@turf/bbox').default;
const concaveman = require('concaveman');
const destination = require('@turf/destination').default;
const helpers = require('@turf/helpers');
const pointGrid = require('@turf/point-grid').default;

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

const groupByInterval = (destinations, intervals, travelTime) =>
  intervals.reduce((pointsByInterval, interval) => {
    const intervalInSeconds = interval * 60;
    pointsByInterval[interval] = destinations.reduce((acc, point, index) => {
      if (travelTime[index] !== null && travelTime[index] <= intervalInSeconds) {
        acc.push(point.location);
      }
      return acc;
    }, []);

    return pointsByInterval;
  }, {});

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

module.exports = { makeGrid, groupByInterval, makePolygons };
