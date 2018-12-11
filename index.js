const { makeGrid, makeDistanceMatrix, makeIsochrone } = require('./utils');

module.exports = async (startPoint, options) => {
  const grid = makeGrid(startPoint, options);
  const distanceMatrix = await makeDistanceMatrix(startPoint, grid, options);
  const isochrone = makeIsochrone(distanceMatrix, options);

  return isochrone;
};
