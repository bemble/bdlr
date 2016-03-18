'use strict';

var assert = require('assert');
var fs = require('fs');

suite('Bundle', () => {
  var Bundle, bdl;
  suiteSetup(() => {
    Bundle = require('../src/Bundle');
  });

  setup(() => {
    bdl = new Bundle('_');
  });

  test('throws if no type given', () => {
    try {
      new Bundle();
      assert(false, 'did not throw');
    } catch (e) {
      assert(true);
    }
  });

  suite('includeFile', () => {
    test('returns current instance', () => {
      assert.strictEqual(bdl.includeFile(), bdl);
    });

    test('can include a file', () => {
      bdl.includeFile('foo');
      assert.deepEqual(bdl._patterns, [{pattern: 'foo'}]);
    });

    test('include file once', () => {
      bdl.includeFile('foo').includeFile('foo');
      assert.deepEqual(bdl._patterns, [{pattern: 'foo'}]);
    });
  });

  suite('includeGlob', () => {
    test('returns current instance', () => {
      assert.strictEqual(bdl.includeGlob(), bdl);
    });

    test('can include a glob', () => {
      bdl.includeGlob('foo');
      assert.deepEqual(bdl._patterns, [{pattern: 'foo', glob: true, ignored: undefined}]);
    });

    test('include glob once', () => {
      bdl.includeGlob('foo').includeGlob('foo');
      assert.deepEqual(bdl._patterns, [{pattern: 'foo', glob: true, ignored: undefined}]);
    });

    test('can ignore globs', () => {
      bdl.includeGlob('foo', ['f*o']);
      assert.deepEqual(bdl._patterns, [{pattern: 'foo', glob: true, ignored: ['f*o']}]);
    });
  });

  suite('includeBowerComponents', () => {
    test('returns current instance', () => {
      assert.strictEqual(bdl.includeBowerComponents(), bdl);
    });
    test('set a flag', () => {
      bdl.includeBowerComponents();
      assert.deepEqual(bdl._bowerComponents.included, true);
    });
  });

  suite('files geter', () => {
    suiteSetup(() => {
      [1, 2, 3, 4].forEach((elt) => {
        fs.writeFileSync('exists' + elt);
      });
    });

    suiteTeardown(() => {
      [1, 2, 3, 4].forEach((elt) => {
        fs.unlinkSync('exists' + elt);
      });
    });


    test('gives only existing files', () => {
      bdl.includeFile('doesNotExists');
      bdl.includeFile('exists1');

      assert.deepEqual(bdl.files, ['exists1']);
    });

    test('handles globs', () => {
      bdl.includeGlob('exists*', ['exists3']);

      assert.deepEqual(bdl.files, ['exists1', 'exists2', 'exists4']);
    });

    test('return uniq files and cares about order', () => {
      bdl.includeFile('exists2').includeGlob('exists*').includeFile('exists3');

      assert.deepEqual(bdl.files, ['exists2', 'exists1', 'exists4', 'exists3']);
    });

    suite('bower components', () => {
      let confs = {
        'test': {main: ['test.js', 'test.css'], dependencies: {'test-2': '*'}},
        'test-2': {main: ['test-first.js', 'test-first.css']},
        'test-dev': {main: ['test-dev.js', 'test-dev.css']}
      };

      suiteSetup(() => {
        let rootConf = {
          dependencies: {test: '*'},
          devDependencies: {'test-dev': '*'}
        };

        fs.mkdirSync('bower_components');
        fs.writeFileSync('bower.json', JSON.stringify(rootConf));
        Object.keys(confs).forEach((component) => {
          fs.mkdirSync('bower_components/' + component);
          fs.writeFileSync('bower_components/' + component + '/.bower.json', JSON.stringify(confs[component]));
          confs[component].main.forEach((file) => {
            fs.writeFileSync('bower_components/' + component + '/' + file);
          });
        });
      });

      suiteTeardown(() => {
        fs.unlinkSync('bower.json');

        Object.keys(confs).forEach((component) => {
          fs.unlinkSync('bower_components/' + component + '/.bower.json');
          confs[component].main.forEach((file) => {
            fs.unlinkSync('bower_components/' + component + '/' + file);
          });
          fs.rmdirSync('bower_components/' + component);
        });
        fs.rmdirSync('bower_components');
      });

      test('handles bower components main files and dependencies', () => {
        let styleBdl = new Bundle(Bundle.STYLE);
        styleBdl.includeBowerComponents();
        assert.deepEqual(styleBdl.files, ['bower_components/test-2/test-first.css', 'bower_components/test/test.css']);

        let scriptBdl = new Bundle(Bundle.SCRIPT);
        scriptBdl.includeBowerComponents();
        assert.deepEqual(scriptBdl.files, ['bower_components/test-2/test-first.js', 'bower_components/test/test.js']);
      });

      test('handles devDependencies', () => {
        let styleBdl = new Bundle(Bundle.STYLE);
        styleBdl.includeBowerComponents(true);
        assert.deepEqual(styleBdl.files, ['bower_components/test-2/test-first.css', 'bower_components/test-dev/test-dev.css', 'bower_components/test/test.css']);

        let scriptBdl = new Bundle(Bundle.SCRIPT);
        scriptBdl.includeBowerComponents(true);
        assert.deepEqual(scriptBdl.files, ['bower_components/test-2/test-first.js', 'bower_components/test-dev/test-dev.js', 'bower_components/test/test.js']);
      });

      test('can ignore packages', () => {
        let styleBdl = new Bundle(Bundle.STYLE);
        styleBdl.includeBowerComponents(false, ['test-2']);
        assert.deepEqual(styleBdl.files, ['bower_components/test/test.css']);

        let scriptBdl = new Bundle(Bundle.SCRIPT);
        scriptBdl.includeBowerComponents(true, ['test-2']);
        assert.deepEqual(scriptBdl.files, ['bower_components/test-dev/test-dev.js', 'bower_components/test/test.js']);
      });
    });

    test('BUG does not care about glob order', () => {
      bdl.includeGlob('exists*').includeGlob('exists[12]');

      assert.deepEqual(bdl.files, ['exists1', 'exists2', 'exists3', 'exists4'], 'expect: ' + ['exists3', 'exists4', 'exists1', 'exists2']);
    });

    suite('cares about running environment', () => {
      let envBackup;
      suiteSetup(() => {
        envBackup = Bundle.ENV;

        fs.writeFileSync('exists1.debug');
        fs.writeFileSync('exists1.min');
        fs.writeFileSync('another');
        fs.writeFileSync('another.min');
      });

      teardown(() => {
        Bundle.ENV = envBackup
      });

      suiteTeardown(() => {
        fs.unlinkSync('exists1.debug');
        fs.unlinkSync('exists1.min');
        fs.unlinkSync('another');
        fs.unlinkSync('another.min');
      });

      test('development', () => {
        Bundle.ENV = "development";
        bdl.includeFile('exists1').includeFile('exists2').includeFile('another');
        assert.deepEqual(bdl.files, ['exists1.debug', 'exists2', 'another']);
      });

      test('production', () => {
        Bundle.ENV = "production";
        bdl.includeFile('exists1').includeFile('exists2').includeFile('another');
        assert.deepEqual(bdl.files, ['exists1.min', 'exists2', 'another.min']);
      });

    });
  });

  suite('toStrings', () => {
    suiteSetup(() => {
      [1, 2].forEach((elt) => {
        fs.writeFileSync('exists' + elt);
      });
    });

    suiteTeardown(() => {
      [1, 2].forEach((elt) => {
        fs.unlinkSync('exists' + elt);
      });
    });

    test('get style tag string of bundle', () => {
      bdl.includeGlob('exists*');
      assert.equal(bdl.toStyleString(), '<link rel="stylesheet" type="text/css" href="exists1" /><link rel="stylesheet" type="text/css" href="exists2" />');
    });

    test('get script tag string of bundle', () => {
      bdl.includeGlob('exists*');
      assert.equal(bdl.toScriptString(), '<script src="exists1"></script><script src="exists2"></script>');
    });

    test('get string depending on bundle type', () => {
      let styleBdl = new Bundle(Bundle.STYLE);
      styleBdl.includeGlob('exists*');
      assert.equal(styleBdl.toString(), '<link rel="stylesheet" type="text/css" href="exists1" /><link rel="stylesheet" type="text/css" href="exists2" />');

      let scriptBdl = new Bundle(Bundle.SCRIPT);
      scriptBdl.includeGlob('exists*');
      assert.equal(scriptBdl.toString(), '<script src="exists1"></script><script src="exists2"></script>');
    });

    suite('environnement', () => {
      let envBackup;
      suiteSetup(() => {
        envBackup = Bundle.ENV;
      });

      teardown(() => {
        Bundle.ENV = envBackup
      });

      test('production url the one given in the constructor and an etag is set', () => {
        Bundle.ENV = 'production';
        let styleBdl = new Bundle(Bundle.STYLE, '/foo/bar.css');
        styleBdl.includeGlob('exists*');
        assert.equal(styleBdl.toString(), '<link rel="stylesheet" type="text/css" href="/foo/bar.css?etag=842531b3dd533f0a349bb6e9f709c334" />');

        let scriptBdl = new Bundle(Bundle.SCRIPT, '/foo/bar.js');
        scriptBdl.includeGlob('exists*');
        assert.equal(scriptBdl.toString(), '<script src="/foo/bar.js?etag=c569ddd8dbc9a43c7a9627810289e880"></script>');
      });
    });
  });

  suite('getMinifiedContent', () => {
    suiteSetup(() => {
      [1, 2].forEach((elt) => {
        fs.writeFileSync('file' + elt + '.css', '/*Useless comment*/\nbody {\n\tcolor: red;\n}');
        fs.writeFileSync('file' + elt + '.js', '/*Useless comment*/\nif(false) {\n\tconsole.log(\'never here\');\n}\nconsole.log(\'lol\');\n (function() { function test(){} test(); })();');
      });
    });

    suiteTeardown(() => {
      [1, 2].forEach((elt) => {
        fs.unlinkSync('file' + elt + '.css');
        fs.unlinkSync('file' + elt + '.js');
      });
    });

    test('minify bundles', () => {
      Bundle.ENV = 'production';
      let styleBdl = new Bundle(Bundle.STYLE, '/foo/bar.css');
      styleBdl.includeGlob('file*.css');
      assert.equal(styleBdl.getMinifiedContent(), 'body{color:red}');

      let scriptBdl = new Bundle(Bundle.SCRIPT, '/foo/bar.js');
      scriptBdl.includeGlob('file*.js');
      assert.equal(scriptBdl.getMinifiedContent(), 'if(false){console.log("never here")}console.log("lol");(function(){function o(){}o()})();if(false){console.log("never here")}console.log("lol");(function(){function o(){}o()})();');
    });
  });
});