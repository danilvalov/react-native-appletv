/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const findXcodeProject = require('./findXcodeProject');
const parseTVOSDevicesList = require('./parseTVOSDevicesList');
const findMatchingSimulator = require('./findMatchingSimulator');

function runTVOS(argv, config, args) {
  process.chdir(args.projectPath);
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error('Could not find Xcode project files in tvos folder');
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  const scheme = args.scheme || inferredSchemeName;
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);
  const devices = parseTVOSDevicesList(
    child_process.execFileSync('xcrun', ['instruments', '-s'], {encoding: 'utf8'})
  );
  if (args.device) {
    const selectedDevice = matchingDevice(devices, args.device);
    if (selectedDevice){
      return runOnDevice(selectedDevice, scheme, xcodeProject);
    } else {
      if (devices){
        console.log('Could not find device with the name: "' + args.device + '".');
        console.log('Choose one of the following:');
        printFoundDevices(devices);
      } else {
        console.log('No tvOS devices connected.');
      }
    }
  } else if (args.udid) {
    return runOnDeviceByUdid(args.udid, scheme, xcodeProject, devices);
  } else {
    return runOnSimulator(xcodeProject, args, inferredSchemeName, scheme);
  }
}

function runOnDeviceByUdid(udid, scheme, xcodeProject, devices) {
  const selectedDevice = matchingDeviceByUdid(devices, udid);
  if (selectedDevice){
    return runOnDevice(selectedDevice, scheme, xcodeProject);
  } else {
    if (devices){
      console.log('Could not find device with the udid: "' + udid + '".');
      console.log('Choose one of the following:');
      printFoundDevices(devices);
    } else {
      console.log('No tvOS devices connected.');
    }
  }
}

function runOnSimulator(xcodeProject, args, inferredSchemeName, scheme){
  return new Promise((resolve) => {
    try {
      var simulators = JSON.parse(
      child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {encoding: 'utf8'})
      );
    } catch (e) {
      throw new Error('Could not parse the simulator list output');
    }

    const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
    if (!selectedSimulator) {
      throw new Error(`Cound't find ${args.simulator} simulator`);
    }

    const simulatorFullName = formattedDeviceName(selectedSimulator);
    console.log(`Launching ${simulatorFullName}...`);
    try {
      child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
    } catch (e) {
      // instruments always fail with 255 because it expects more arguments,
      // but we want it to only launch the simulator
    }
    resolve(selectedSimulator.udid)
  })
  .then((udid) => buildProject(xcodeProject, udid, scheme))
  .then((appName) => {
    if (!appName) {
      appName = inferredSchemeName;
    }
    const appPath = `build/Build/Products/Debug-appletvsimulator/${appName}.app`;
    console.log(`Installing ${appPath}`);
    child_process.spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], {stdio: 'inherit'});

    const bundleID = child_process.execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'}
    ).trim();

    console.log(`Launching ${bundleID}`);
    child_process.spawnSync('xcrun', ['simctl', 'launch', 'booted', bundleID], {stdio: 'inherit'});
  })
}

function runOnDevice(selectedDevice, scheme, xcodeProject){
  return buildProject(xcodeProject, selectedDevice.udid, scheme)
  .then((appName) => {
    if (!appName) {
      appName = scheme;
    }
    const tvosDeployInstallArgs = [
      '--bundle', 'build/Build/Products/Debug-appletvos/' + appName + '.app',
      '--id' , selectedDevice.udid,
      '--justlaunch'
    ];
    console.log(`installing and launching your app on ${selectedDevice.name}...`);
    const tvosDeployOutput = child_process.spawnSync('tvos-deploy', tvosDeployInstallArgs, {encoding: 'utf8'});
    if (tvosDeployOutput.error) {
      console.log('');
      console.log('** INSTALLATION FAILED **');
      console.log('Make sure you have ios-deploy installed globally.');
      console.log('(e.g "npm install -g ios-deploy")');
    } else {
      console.log('** INSTALLATION SUCCEEDED **');
    }
  });
}

function buildProject(xcodeProject, udid, scheme) {
  return new Promise((resolve,reject) =>
  {
     const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name,
      '-scheme', scheme,
      '-destination', `id=${udid}`,
      '-derivedDataPath', 'build',
    ];
    console.log(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
    const buildProcess = child_process.spawn('xcodebuild', xcodebuildArgs);
    let buildOutput = "";
    buildProcess.stdout.on('data', function(data) {
      console.log(data.toString());
      buildOutput += data.toString();
    });
    buildProcess.stderr.on('data', function(data) {
      console.error(data.toString());
    });
    buildProcess.on('close', function(code) {
      //FULL_PRODUCT_NAME is the actual file name of the app, which actually comes from the Product Name in the build config, which does not necessary match a scheme name,  example output line: export FULL_PRODUCT_NAME="Super App Dev.app"
      let productNameMatch = /export FULL_PRODUCT_NAME="?(.+).app/.exec(buildOutput);
      if (productNameMatch && productNameMatch.length && productNameMatch.length > 1) {
        return resolve(productNameMatch[1]);//0 is the full match, 1 is the app name
      }
      return buildProcess.error? reject(error) : resolve();
    });
  });
}


function matchingDevice(devices, deviceName) {
  if (deviceName === true && devices.length === 1)
  {
    console.log(`Using first available device ${devices[0].name} due to lack of name supplied.`)
    return devices[0];
  }  
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].name === deviceName || formattedDeviceName(devices[i]) === deviceName) {
      return devices[i];
    }
  }
}


function matchingDeviceByUdid(devices, udid) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].udid === udid) {
      return devices[i];
    }
  }
}

function formattedDeviceName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

function printFoundDevices(devices){
  for (let i = devices.length - 1; i >= 0; i--) {
    console.log(devices[i].name + ' Udid: ' + devices[i].udid);
  }
}

module.exports = {
  name: 'run-tvos',
  description: 'builds your app and starts it on tvOS simulator',
  func: runTVOS,
  examples: [
  {
    desc: 'Run on a different simulator, e.g. iPhone 5',
    cmd: 'react-native run-tvos --simulator "iPhone 5"',
  },
  {
    desc: 'Pass a non-standard location of tvOS directory',
    cmd: 'react-native run-tvos --project-path "./app/tvos"',
  },
  {
    desc: "Run on a connected device, e.g. Max's iPhone",
    cmd: "react-native run-tvos --device 'Max's iPhone'",
  },
  ],
  options: [{
    command: '--simulator [string]',
    description: 'Explicitly set simulator to use',
    default: 'Apple TV 1080p',
  }, {
    command: '--scheme [string]',
    description: 'Explicitly set Xcode scheme to use',
  }, {
    command: '--project-path [string]',
    description: 'Path relative to project root where the Xcode project '
      + '(.xcodeproj) lives. The default is \'tvos\'.',
    default: 'tvos',
  }, {
    command: '--device [string]',
    description: 'Explicitly set device to use by name.  The value is not required if you have a single device connected.',
  },{
    command: '--udid [string]',
    description: 'Explicitly set device to use by udid',
  }]
};
