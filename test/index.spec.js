'use strict';

var assert = require('assert');

suite('index', () => {
  test('exports an instance of Bldr', () => {
    let bdlr = require('../index');
    assert.equal(bdlr.constructor.name, 'Bdlr');
  });
});