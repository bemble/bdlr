'use strict';

var Bundle = require('./Bundle');

class Bdlr {
  constructor() {
    this.bundles = {};

    this.STYLE = Bundle.STYLE;
    this.SCRIPT = Bundle.SCRIPT;
  }

  createBundle(name, type, renderedUrl) {
    return this.bundles[name] = new Bundle(type, renderedUrl);
  }

  get ENV() {
    return Bundle.ENV;
  }

  set ENV(newEnv) {
    Bundle.ENV = newEnv;
  }
}

module.exports = Bdlr;