# Isochrone

[![npm version](https://img.shields.io/npm/v/isochrone.svg)](https://www.npmjs.com/package/isochrone)
[![npm downloads](https://img.shields.io/npm/dt/isochrone.svg)](https://www.npmjs.com/package/isochrone)
[![Build Status](https://travis-ci.com/stepankuzmin/node-isochrone.svg?branch=master)](https://travis-ci.com/stepankuzmin/node-isochrone)

Isochrone maps are commonly used to depict areas of equal travel time.
Build isochrones using [OSRM](http://project-osrm.org/), [Turf](http://turfjs.org/) and [concaveman](https://github.com/mapbox/concaveman).

![screenshot](https://raw.githubusercontent.com/stepankuzmin/galton/master/example.png)

## Installation

```sh
npm install osrm isochrone
```

## Usage

### Building OSRM graph

This package consumes preprocessed [OSRM](http://project-osrm.org/) graph as an input. To build such a graph you have to extract it from your OSM file with one of [profiles](https://github.com/Project-OSRM/osrm-backend/wiki/Profiles) and build it using one of the algorithms (Contraction Hierarchies or Multi-Level Dijkstra).

To build OSRM graph using `isochrone` package, you can clone the source code and install dependencies

```sh
git clone https://github.com/stepankuzmin/node-isochrone.git
cd node-isochrone
npm i
```

Here is an example of how to extract graph using `foot` profile and build it using contraction hierarchies algorithm.

```sh
wget https://s3.amazonaws.com/mapbox/osrm/testing/monaco.osm.pbf
./node_modules/osrm/lib/binding/osrm-extract -p ./node_modules/osrm/profiles/foot.lua monaco.osm.pbf
./node_modules/osrm/lib/binding/osrm-contract monaco.osrm
```

### Example

See [API](https://github.com/stepankuzmin/node-isochrone/blob/master/API.md) for more info.

```js
const OSRM = require("osrm");
const isochrone = require("isochrone");

const osrm = new OSRM({ path: "./monaco.osrm" });

const startPoint = [7.42063, 43.73104];

const options = {
  osrm,
  radius: 2,
  cellSize: 0.1,
  intervals: [5, 10, 15]
};

isochrone(startPoint, options).then(geojson => {
  console.log(JSON.stringify(geojson, null, 2));
});
```
