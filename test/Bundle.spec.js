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
    } catch(e) {
      assert(true);
    }
  });

  suite('includeFile', () => {
    test('returns current instance', () => {
      assert.strictEqual(bdl.includeFile(), bdl);
    });

    test('can include a file',() => {
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

  suite('files geter', () => {
    suiteSetup(() => {
      [1,2,3,4].forEach((elt) => {
        fs.writeFileSync('exists'+elt);
      });
    });

    suiteTeardown(() => {
      [1,2,3,4].forEach((elt) => {
        fs.unlinkSync('exists'+elt);
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

    test('BUG does not care about glob order', () => {
      bdl.includeGlob('exists*').includeGlob('exists[12]');

      assert.deepEqual(bdl.files, ['exists1', 'exists2', 'exists3', 'exists4'], 'expect: '+ ['exists3', 'exists4', 'exists1', 'exists2']);
    });


    suite('cares about running environment', () => {
      let envBackup;
      suiteSetup(() => {
        envBackup = process.env.NODE_ENV;

        fs.writeFileSync('exists1.debug');
        fs.writeFileSync('exists1.min');
        fs.writeFileSync('another');
        fs.writeFileSync('another.min');
      });

      teardown(() => {
        process.env.NODE_ENV = envBackup
      });

      suiteTeardown(() => {
        fs.unlinkSync('exists1.debug');
        fs.unlinkSync('exists1.min');
        fs.unlinkSync('another');
        fs.unlinkSync('another.min');
      });

      test('development', () => {
        process.env.NODE_ENV = "development";
        bdl.includeFile('exists1').includeFile('exists2').includeFile('another');
        assert.deepEqual(bdl.files, ['exists1.debug', 'exists2', 'another']);
      });

      test('production', () => {
        process.env.NODE_ENV = "production";
        bdl.includeFile('exists1').includeFile('exists2').includeFile('another');
      assert.deepEqual(bdl.files, ['exists1.min', 'exists2', 'another.min']);
      });

    });
  });

  suite('toStrings', () => {
    suiteSetup(() => {
        [1,2].forEach((elt) => {
          fs.writeFileSync('exists'+elt);
      });
    });

    suiteTeardown(() => {
      [1,2].forEach((elt) => {
        fs.unlinkSync('exists'+elt);
      });
    });

    test('get style tag string of bundle', () => {
      bdl.includeGlob('exists*');
      assert.equal(bdl.toStyleString(), '<link rel="stylesheet" href="exists1" /><link rel="stylesheet" href="exists2" />');
    });

    test('get script tag string of bundle', () => {
      bdl.includeGlob('exists*');
      assert.equal(bdl.toScriptString(), '<script src="exists1"></script><script src="exists2"></script>');
    });

    test('get string depending on bundle type', () => {
      let styleBdl = new Bundle(Bundle.STYLE);
      styleBdl.includeGlob('exists*');
      assert.equal(styleBdl.toString(), '<link rel="stylesheet" href="exists1" /><link rel="stylesheet" href="exists2" />');

      let scriptBdl = new Bundle(Bundle.SCRIPT);
      scriptBdl.includeGlob('exists*');
      assert.equal(scriptBdl.toString(), '<script src="exists1"></script><script src="exists2"></script>');
    });
  });
});