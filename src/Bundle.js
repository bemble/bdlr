'use strict';

var fs = require('fs');
var glob = require('glob');
var path = require('path');

class Bundle {
  constructor(type) {
    if(!type) {
      throw 'No bundle type given';
    }

    this._type = type;
    this._patterns = [];
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
    if(process.env.NODE_ENV === "production") {
      return exts.reverse();
    }
    return exts;
  }

  toString() {
    return this._type === Bundle.STYLE ? this.toStyleString() : this.toScriptString();
  }

  toStyleString() {
    return this.files.map((elt) => {
        return '<link rel="stylesheet" href="'+elt+'" />';
    }).join('');
  }

  toScriptString() {
    return this.files.map((elt) => {
        return '<script src="'+elt+'"></script>';
    }).join('');
  }
}

Bundle.STYLE = 1;
Bundle.SCRIPT = 2;

module.exports = Bundle;