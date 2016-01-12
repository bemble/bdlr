'use strict';

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var crypto = require('crypto');
var CleanCSS = require('clean-css');
var UglifyJS = require("uglify-js");

class Bundle {
  constructor(type, renderedUrl) {
    if(!type) {
      throw 'No bundle type given';
    }

    this.type = type;
    this._patterns = [];
    this.url = renderedUrl;
  }

  _patternAlreadyExists(pattern) {
    return this._patterns.some((elt) => {
      return elt.pattern === pattern;
    });
  }

  includeFile(filePath) {
    !this._patternAlreadyExists(filePath) && this._patterns.push({pattern: filePath});
    return this;
  }

  includeGlob(glob, ignoredPatterns) {
    !this._patternAlreadyExists(glob) && this._patterns.push({pattern: glob, glob: true, ignored: ignoredPatterns});
    return this;
  }

  _fileExists(filePath) {
    try {
      return !!fs.statSync(filePath);
    } catch(e) {}
    return false;
  }

  get files() {
    let files = [];
    this._patterns.forEach((ptrn) => {
        // Add a file
        if(!ptrn.glob) {
          this._addFile(ptrn.pattern, files, true);
        }
        // Add a glob
        else {
          glob.sync(ptrn.pattern, {ignore: ptrn.ignored}).forEach((elt) => {
            this._addFile(elt, files, false);
          });
        }
    });

    return files.map((elt) => {
        let foundPreExt = this._extEnvOrder.find((preExt) => {
          return this._fileExists(elt.file + preExt + elt.ext);
        });
        return foundPreExt !== undefined ? elt.file + foundPreExt + elt.ext : undefined;
    }).filter((elt) => { return elt !== undefined });
  }

  _addFile(file, files, deletePrevious) {
    let fileParsed = path.parse(file.replace('.min.', '.').replace('.debug.', '.'));
    let rawFile = fileParsed.dir + (fileParsed.dir ? path.sep : '') + fileParsed.name;

    let ptrnIndex = files.findIndex((elt) => {
      return elt.file === rawFile;
    });

    if(ptrnIndex >= 0) {
      if(!deletePrevious) {
        return;
      }
      files.splice(ptrnIndex,1);
    }
    files.push({file: rawFile, ext: fileParsed.ext});
  }

  get _extEnvOrder() {
    let exts = ['.debug', '', '.min'];
    return this._isProdEnv ? exts.reverse() : exts;
  }

  toString() {
    return this.type === Bundle.STYLE ? this.toStyleString() : this.toScriptString();
  }

  toStyleString() {
    if(this._isProdEnv) {
      var hash = crypto.createHash('md5').update(this.getMinifiedContent()).digest('hex');
      return '<link rel="stylesheet" href="'+this.url+'?etag='+hash+'" />';
    }
    return this.files.map((elt) => {
        return '<link rel="stylesheet" href="'+elt+'" />';
    }).join('');
  }

  toScriptString() {
    if(this._isProdEnv) {
      var hash = crypto.createHash('md5').update(this.getMinifiedContent()).digest('hex');
      return '<script src="'+this.url+'?etag='+hash+'"></script>';
    }
    return this.files.map((elt) => {
        return '<script src="'+elt+'"></script>';
    }).join('');
  }

  get _isProdEnv() {
    return Bundle.ENV === 'production' || Bundle.ENV === 'prod';
  }

  getMinifiedContent() {
    if(!this._minifiedContent) {
      this._minifiedContent = this.type === Bundle.STYLE ? new CleanCSS().minify(this.files).styles : UglifyJS.minify(this.files, {compress: false}).code;
    }
    return this._minifiedContent;
  }
}

Bundle.ENV = process.env.NODE_ENV;
Bundle.STYLE = 1;
Bundle.SCRIPT = 2;

module.exports = Bundle;