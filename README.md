# Vuejs+D3 Zoomable Treemap

> An implementation, updated to d3v4, in Vuejs, of the [D3 Zoomable Treemap](https://bost.ocks.org/mike/treemap/).

## Dependencies

[Node.js](https://nodejs.org/en/) (>=4.x, 6.x preferred) and npm version 3+.  
[D3V4](https://www.npmjs.com/package/d3v4)

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

## Details
  
There's only one component that matters, in src/components/Treemap.vue, and you can extract it and use it in your own projects. The source data is a JSON file in static/flare.json. If you prefer, you can use this build as a base for your project, which uses the [vuejs-webpack template](https://github.com/vuejs-templates/webpack), containing a webpack + vue-loader setup with hot reload, linting, testing & css extraction.

This implementation of a D3 visualization in Vuejs basically eliminates 3d-select and the need for an explicit rerender of the svg composition.

For a detailed explanation on how things work with [vue-cli](https://github.com/vuejs/vue-cli), check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## License

[MIT](http://opensource.org/licenses/MIT)