# Isochrone

[![Greenkeeper badge](https://badges.greenkeeper.io/stepankuzmin/node-isochrone.svg)](https://greenkeeper.io/)

[![npm version](https://img.shields.io/npm/v/isochrone.svg)](https://www.npmjs.com/package/isochrone)
[![Build Status](https://travis-ci.org/stepankuzmin/node-isochrone.svg?branch=master)](https://travis-ci.org/stepankuzmin/node-isochrone)
[![npm downloads](https://img.shields.io/npm/dt/isochrone.svg)](https://www.npmjs.com/package/galton)

Isochrone maps are commonly used to depict areas of equal travel time.
Build isochrones using [OSRM](http://project-osrm.org/), [Turf](http://turfjs.org/) and [concaveman](https://github.com/mapbox/concaveman).

![Screenshot](https://raw.githubusercontent.com/stepankuzmin/galton/master/example.png)

## Installation

```
npm install -g isochrone
```

## Usage

```js
const OSRM = require('osrm');
const isochrone = require('isochrone');

const osrm = new OSRM({ path: './monaco.osrm' });
const startPoint = [7.41337, 43.72956];

const options = {
  osrm,
  radius: 2,
  cellSize: 0.1,
  intervals: [5, 10, 15],
};

isochrone(startPoint, options)
  .then((geojson) => {
    console.log(JSON.stringify(geojson));
  });
```

See [API](https://github.com/stepankuzmin/node-isochrone/blob/master/API.md) for more info.