# Isochrone

[![npm version](https://img.shields.io/npm/v/isochrone.svg)](https://www.npmjs.com/package/isochrone)
[![npm downloads](https://img.shields.io/npm/dt/isochrone.svg)](https://www.npmjs.com/package/galton)
[![Build Status](https://travis-ci.org/stepankuzmin/node-isochrone.svg?branch=master)](https://travis-ci.org/stepankuzmin/node-isochrone)
[![Greenkeeper badge](https://badges.greenkeeper.io/stepankuzmin/node-isochrone.svg)](https://greenkeeper.io/)

Isochrone maps are commonly used to depict areas of equal travel time.
Build isochrones using [OSRM](http://project-osrm.org/), [Turf](http://turfjs.org/) and [concaveman](https://github.com/mapbox/concaveman).

![Screenshot](https://raw.githubusercontent.com/stepankuzmin/galton/master/example.png)

## Installation

```
npm install -g isochrone
```

## Build graph

```shell
wget https://s3.amazonaws.com/metro-extracts.mapzen.com/moscow_russia.osm.pbf
./node_modules/osrm/lib/binding/osrm-extract -p ./node_modules/osrm/profiles/foot.lua moscow_russia.osm.pbf
./node_modules/osrm/lib/binding/osrm-contract moscow_russia.osrm
```

## Usage

```js
const OSRM = require('osrm');
const isochrone = require('isochrone');

const osrm = new OSRM({ algorithm: 'CH', path: './moscow_russia.osrm' });
const startPoint = [37.62, 55.75];

const options = {
  osrm,
  radius: 2,
  cellSize: 0.1,
  intervals: [5, 10, 15]
};

isochrone(startPoint, options)
  .then((geojson) => {
    console.log(JSON.stringify(geojson, null, 2));
  })
  .catch((error) => {
    console.error(error);
  });

```

See [API](https://stepankuzmin.github.io/node-isochrone) for more info.
