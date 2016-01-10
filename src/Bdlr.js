'use strict';

var Bundle = require('./Bundle');

class Bdlr {
  constructor() {
    this.bundles = {};

    this.STYLE = Bundle.STYLE;
    this.SCRIPT = Bundle.SCRIPT;
  }

  createBundle(name, type) {
    return this.bundles[name] = new Bundle(type);
  }
}

module.exports = Bdlr;