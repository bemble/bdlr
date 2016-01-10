'use strict';

var assert = require('assert');
var fs = require('fs');

suite('Bdlr', () => {

  var bdlr;
  setup(() => {
    bdlr = new (require('../src/Bdlr'))();
  });

  test('can create a new bundle with a name', () => {
    let bundle = bdlr.createBundle('test', '_');
    assert.notEqual(bundle, undefined);
  });
});