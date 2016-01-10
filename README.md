# bdlr
Create &amp; use bundles like you would do in .NET.

## How to use?

### Install

```bash
npm install --save bdlr
```

### Example

**index.js**

```javascript
var bdlr = require('bldr');

bdlr.createBundle('css', bdlr.STYLE).includeFile('bower_components/angular/angular.css').includeGlob('bower_components/*/*.css');
bdlr.createBundle('lib', bdlr.SCRIPT).includeFile('bower_components/angular/angular.js').includeGlob('bower_components/*/*.js', ['bower_components/*/index.js', 'bower_components/*/*-mocks.js']);
bdlr.createBundle('app', bdlr.SCRIPT).includeFile('app/app.js').includeGlob('app/**/*.js').includeFile('app/bootstrap.js');

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
* `createBundle(name:string, type:bdlr.SCRIPT|bdlr.STYLE):Bundle`

**Bundle**

* `files:string[]`: final list of files in the bundle
* `includeFile(filePath:string)`
* `includeGlob(glob:string, ignoredGlobs:string[])`
* `toString()`: get html tags of the bundle

## Note

The included files depends on the running environment of the application. You can pass `.js`, `.debug.js` or `.min.js`, the result will be the same :

* in `development`: bdlr will search for `.debug.js` files, if not present, search for `.js` and if not present, take `.min.js`
* in `production`: bdlr will search for `.min.js` files, if not present, search for `.js` and if not present, take `.debug.js`

**Example**

Considering `yourFile.debug.js`, `yourFile.js` and `yourFile.min.js` and a bundle with `.includeFile('yourFile.js')` or `.includeGlob('*.js')`.

* in `development`, `yourFile.debug.js` will be taken
* in `production`, `yourFile.min.js` will be taken

## What's next?

* minify bundles in a single file per bundle if environment production
* change directory names in rendered string (`toString`)