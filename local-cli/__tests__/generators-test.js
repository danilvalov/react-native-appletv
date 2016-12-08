/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

var path = require('path');
var fs = require('fs');

xdescribe('React Yeoman Generators', function() {
  describe('react:react', function() {
    var assert;

    beforeEach(function() {
      // A deep dependency of yeoman spams console.log with giant json objects.
      // yeoman-generator/node_modules/
      //   download/node_modules/
      //     caw/node_modules/
      //       get-proxy/node_modules/
      //         rc/index.js
      var log = console.log;
      console.log = function() {};
      assert = require('yeoman-generator').assert;
      var helpers = require('yeoman-generator').test;
      console.log = log;

      var generated = false;

      runs(function() {
        helpers.run(path.resolve(__dirname, '../generator'))
          .withArguments(['TestApp'])
          .on('end', function() {
            generated = true;
          });
      });

      waitsFor(function() {
        jest.runAllTicks();
        jest.runOnlyPendingTimers();
        return generated;
      }, "generation", 750);
    });

    it('creates files', function() {
      assert.file([
        '.gitignore',
        '.watchmanconfig',
        'index.tvos.js'
      ]);
    });

    it('replaces vars in index.tvos.js', function() {
      assert.fileContent('index.tvos.js', 'var TestApp = React.createClass({');
      assert.fileContent(
        'index.tvos.js',
        'AppRegistry.registerComponent(\'TestApp\', () => TestApp);'
      );

      assert.noFileContent('index.tvos.js', '<%= name %>');
    });

    it('composes with tvos generator', function() {
      var stat = fs.statSync('tvos');

      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('react:tvos', function() {
    var assert;

    beforeEach(function() {
      // A deep dependency of yeoman spams console.log with giant json objects.
      // yeoman-generator/node_modules/
      //   download/node_modules/
      //     caw/node_modules/
      //       get-proxy/node_modules/
      //         rc/index.js
      var log = console.log;
      console.log = function() {};
      assert = require('yeoman-generator').assert;
      var helpers = require('yeoman-generator').test;
      console.log = log;

      var generated = false;

      runs(function() {
        helpers.run(path.resolve(__dirname, '../generator-tvos'))
          .withArguments(['TestAppTVOS'])
          .on('end', function() {
            generated = true;
          });
      });

      waitsFor(function() {
        jest.runAllTicks();
        jest.runOnlyPendingTimers();
        return generated;
      }, "generation", 750);
    });

    it('creates files', function() {
      assert.file([
        'tvos/TestAppTVOS/AppDelegate.h',
        'tvos/TestAppTVOS/AppDelegate.m',
        'tvos/TestAppTVOS/Base.lproj/LaunchScreen.xib',
        'tvos/TestAppTVOS/Images.xcassets/AppIcon.appiconset/Contents.json',
        'tvos/TestAppTVOS/Info.plist',
        'tvos/TestAppTVOS/main.m',
        'tvos/TestAppTVOS.xcodeproj/project.pbxproj',
        'tvos/TestAppTVOS.xcodeproj/xcshareddata/xcschemes/TestAppTVOS.xcscheme',
        'tvos/TestAppTVOSTests/TestAppTVOSTests.m',
        'tvos/TestAppTVOSTests/Info.plist'
      ]);
    });

    it('replaces vars in AppDelegate.m', function() {
      var appDelegate = 'tvos/TestAppTVOS/AppDelegate.m';

      assert.fileContent(appDelegate, 'moduleName:@"TestAppTVOS"');
      assert.noFileContent(appDelegate, '<%= name %>');
    });

    it('replaces vars in LaunchScreen.xib', function() {
      var launchScreen = 'tvos/TestAppTVOS/Base.lproj/LaunchScreen.xib';

      assert.fileContent(launchScreen, 'text="TestAppTVOS"');
      assert.noFileContent(launchScreen, '<%= name %>');
    });

    it('replaces vars in TestAppTVOSTests.m', function() {
      var tests = 'tvos/TestAppTVOSTests/TestAppTVOSTests.m';

      assert.fileContent(tests, '@interface TestAppTVOSTests : XCTestCase');
      assert.fileContent(tests, '@implementation TestAppTVOSTests');
      assert.noFileContent(tests, '<%= name %>');
    });

    it('replaces vars in project.pbxproj', function() {
      var pbxproj = 'tvos/TestAppTVOS.xcodeproj/project.pbxproj';
      assert.fileContent(pbxproj, '"TestAppTVOS"');
      assert.fileContent(pbxproj, '"TestAppTVOSTests"');
      assert.fileContent(pbxproj, 'TestAppTVOS.app');
      assert.fileContent(pbxproj, 'TestAppTVOSTests.xctest');

      assert.noFileContent(pbxproj, '<%= name %>');
    });

    it('replaces vars in xcscheme', function() {
      var xcscheme = 'tvos/TestAppTVOS.xcodeproj/xcshareddata/xcschemes/TestAppTVOS.xcscheme';
      assert.fileContent(xcscheme, '"TestAppTVOS"');
      assert.fileContent(xcscheme, '"TestAppTVOS.app"');
      assert.fileContent(xcscheme, 'TestAppTVOS.xcodeproj');
      assert.fileContent(xcscheme, '"TestAppTVOSTests.xctest"');
      assert.fileContent(xcscheme, '"TestAppTVOSTests"');

      assert.noFileContent(xcscheme, '<%= name %>');
    });
  });
});
