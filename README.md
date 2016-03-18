# bdlr

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

> Create and use bundles like you would do in .NET.

## How to use?

### Install

```bash
npm install --save bdlr
```

### Example

**index.js**

```javascript
var bdlr = require('bdlr');

bdlr.createBundle('css', bdlr.STYLE)
  .includeBowerComponents()
  .includeGlob('src/**/*.css');
bdlr.createBundle('lib', bdlr.SCRIPT)
  .includeBowerComponents(true, ['angular-mocks']);
bdlr.createBundle('app', bdlr.SCRIPT)
  .includeFile('src/app.js')
  .includeGlob('src/**/*.js', ['src/**/*.exclude.js'])
  .includeFile('src/main.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function (_, res) {
  res.render('mypage', { bundles: bdlr.bundles });
});

app.use('/bower_components', express.static('bower_components'));
```

**mypage.jade**

```jade
doctype html
html
  head
    title My Page
    | !{bundles.css}
  body
    block content
    | !{bundles.lib}
    | !{bundles.app}
```

## API

**Bdlr**

* `bundles:Object`: collection of registred bundles 
* `createBundle(name:string, type:bdlr.SCRIPT|bdlr.STYLE, renderedUrl:string):Bundle`: `renderedUrl` is what is rendered in production 
* `ENV:string`: current environnement, default is `process.env.NODE_ENV`. Can be set but only `prod[uction]` change the `Bundle` behaviors.

**Bundle**

* `constructor(type:Bundle.SCRIPT|Bundle.STYLE[, renderedUrl:string])`
* `type:number`: type of bundle (script or style), `type` param of the constructor
* `url:string`: `renderedUrl` param of the constructor
* `files:string[]`: final list of files in the bundle
* `includeFile(filePath:string)`
* `includeGlob(glob:string, ignoredGlobs:string[])`
* `includeBowerComponents([includeDevComponents:boolean, [ignoredPackages:string[]]])`: add your bower components in the bundle, including the dev components if arguments is true
* `toString():string`: get html tags of the bundle. if `bdlr.ENV` is prod, `renderedUrl` will be the url
* `getMinifiedContent():string`: get the minified content of the bundle

## Serve production bundles files with Express

:warning: You should consider a file cache to increase performances.

```javascript
// ...
var app = express();
var bdlr = require('bdlr');

var includeBowerDevDependencies = true;
bdlr.createBundle('style', bdlr.STYLE, '/style.css')
  .includeBowerComponents(includeBowerDevDependencies)
  .includeGlob('src/**/*.css');
  
bdlr.createBundle('lib', bdlr.SCRIPT, '/lib.js')
  .includeBowerComponents(includeBowerDevDependencies, ['angular-mocks']);
  
bdlr.createBundle('app', bdlr.SCRIPT, '/app.js')
  .includeFile('src/app.js')
  .includeGlob('src/**/*.js', ['src/**/*.exclude.js'])
  .includeFile('src/main.js');
bdlr.ENV = 'production';

//...

Object.keys(bdlr.bundles).forEach((bundleName) => {
  var bundle = bdlr.bundles[bundleName];
  app.get(bundle.url, (req, res) => {
    res.set('Content-Type', bundle.type === bdlr.SCRIPT ? 'application/javascript' : 'text/css');
    res.send(bundle.getMinifiedContent());
  });
});
```

## Note

The included files depends on environment of `bdlr`. You can pass `.js`, `.debug.js` or `.min.js`, the result will be the same :

* in `development`: bdlr will search for `.debug.js` files, if not present, search for `.js` and if not present, take `.min.js`
* in `production`: bdlr will search for `.min.js` files, if not present, search for `.js` and if not present, take `.debug.js`

**Example**

Considering `yourFile.debug.js`, `yourFile.js` and `yourFile.min.js` and a bundle with `.includeFile('yourFile.js')` or `.includeGlob('*.js')`.

* in `development`, `yourFile.debug.js` will be taken
* in `production`, `yourFile.min.js` will be taken

## Dev note

To run the tests, simply install `mocha` globally and run:

```sh
mocha
```

[npm-url]:https://npmjs.org/package/bdlr
[npm-image]:https://badge.fury.io/js/bdlr.svg
[travis-url]:https://travis-ci.org/pierrecle/bdlr
[travis-image]:https://travis-ci.org/pierrecle/bdlr.svg?branch=master
[coveralls-url]:https://coveralls.io/github/pierrecle/bdlr?branch=master
[coveralls-image]:https://coveralls.io/repos/github/pierrecle/bdlr/badge.svg?branch=master