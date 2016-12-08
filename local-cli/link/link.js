/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const log = require('npmlog');
const path = require('path');
const uniq = require('lodash').uniq;
const flatten = require('lodash').flatten;
const chalk = require('chalk');

const isEmpty = require('lodash').isEmpty;
const promiseWaterfall = require('./promiseWaterfall');
const registerDependencyTVOS = require('./tvos/registerNativeModule');
const isInstalledTVOS = require('./tvos/isInstalled');
const copyAssetsTVOS = require('./tvos/copyAssets');
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const pollParams = require('./pollParams');
const commandStub = require('./commandStub');
const promisify = require('./promisify');

log.heading = 'rnpm-link';

const dedupeAssets = (assets) => uniq(assets, asset => path.basename(asset));


const linkDependencyTVOS = (tvOSProject, dependency) => {
  if (!tvOSProject || !dependency.config.tvos) {
    return;
  }

  const isInstalled = isInstalledTVOS(tvOSProject, dependency.config.tvos);

  if (isInstalled) {
    log.info(chalk.grey(`tvOS module ${dependency.name} is already linked`));
    return;
  }

  log.info(`Linking ${dependency.name} tvos dependency`);

  registerDependencyTVOS(dependency.config.tvos, tvOSProject);

  log.info(`tvOS module ${dependency.name} has been successfully linked`);
};

const linkAssets = (project, assets) => {
  if (isEmpty(assets)) {
    return;
  }

  log.info('Linking assets to tvos project');
  copyAssetsTVOS(assets, project.tvos);

  log.info('Assets have been successfully linked to your project');
};

/**
 * Updates project and linkes all dependencies to it
 *
 * If optional argument [packageName] is provided, it's the only one that's checked
 */
function link(args, config) {
  var project;
  try {
    project = config.getProjectConfig();
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure it\'s a React Native project?'
    );
    return Promise.reject(err);
  }

  const packageName = args[0];

  const dependencies = getDependencyConfig(
    config,
    packageName ? [packageName] : getProjectDependencies()
  );

  const assets = dedupeAssets(dependencies.reduce(
    (assets, dependency) => assets.concat(dependency.config.assets),
    project.assets
  ));

  const tasks = flatten(dependencies.map(dependency => [
    () => promisify(dependency.config.commands.prelink || commandStub),
    () => linkDependencyTVOS(project.tvos, dependency),
    () => promisify(dependency.config.commands.postlink || commandStub),
  ]));

  tasks.push(() => linkAssets(project, assets));

  return promiseWaterfall(tasks).catch(err => {
    log.error(
      `It seems something went wrong while linking. Error: ${err.message} \n`
      + 'Please file an issue here: https://github.com/facebook/react-native/issues'
    );
    throw err;
  });
}

module.exports = {
  func: link,
  description: 'links all native dependencies',
  name: 'link [packageName]',
};
