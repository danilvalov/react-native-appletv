const log = require('npmlog');

const getProjectDependencies = require('./getProjectDependencies');
const unregisterDependencyTVOS = require('./tvos/unregisterNativeModule');
const isInstalledTVOS = require('./tvos/isInstalled');
const unlinkAssetsTVOS = require('./tvos/unlinkAssets');
const getDependencyConfig = require('./getDependencyConfig');
const compact = require('lodash').compact;
const difference = require('lodash').difference;
const filter = require('lodash').filter;
const find = require('lodash').find;
const flatten = require('lodash').flatten;
const isEmpty = require('lodash').isEmpty;
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');

log.heading = 'rnpm-link';

const unlinkDependencyTVOS = (tvOSProject, dependency, packageName, tvOSDependencies) => {
  if (!tvOSProject || !dependency.tvos) {
    return;
  }

  const isInstalled = isInstalledTVOS(tvOSProject, dependency.tvos);

  if (!isInstalled) {
    log.info(`tvOS module ${packageName} is not installed`);
    return;
  }

  log.info(`Unlinking ${packageName} tvos dependency`);

  unregisterDependencyTVOS(dependency.tvos, tvOSProject, tvOSDependencies);

  log.info(`tvOS module ${packageName} has been successfully unlinked`);
};

/**
 * Updates project and unlink specific dependency
 *
 * If optional argument [packageName] is provided, it's the only one
 * that's checked
 */
function unlink(args, config) {
  const packageName = args[0];

  var project;
  var dependency;

  try {
    project = config.getProjectConfig();
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure it\'s a React Native project?'
    );
    return Promise.reject(err);
  }

  try {
    dependency = config.getDependencyConfig(packageName);
  } catch (err) {
    log.warn(
      'ERRINVALIDPROJ',
      `Project ${packageName} is not a react-native library`
    );
    return Promise.reject(err);
  }

  const allDependencies = getDependencyConfig(config, getProjectDependencies());
  const otherDependencies = filter(allDependencies, d => d.name !== packageName);
  const thisDependency = find(allDependencies, d => d.name === packageName);
  const tvOSDependencies = compact(otherDependencies.map(d => d.config.tvos));

  const tasks = [
    () => promisify(thisDependency.config.commands.preunlink || commandStub),
    () => unlinkDependencyTVOS(project.tvos, dependency, packageName, tvOSDependencies),
    () => promisify(thisDependency.config.commands.postunlink || commandStub)
  ];

  return promiseWaterfall(tasks)
    .then(() => {
      const assets = difference(
        dependency.assets,
        flatten(allDependencies, d => d.assets)
      );

      if (isEmpty(assets)) {
        return Promise.resolve();
      }

      log.info('Unlinking assets from tvos project');
      unlinkAssetsTVOS(assets, project.tvos);

      log.info(
        `${packageName} assets has been successfully unlinked from your project`
      );
    })
    .catch(err => {
      log.error(
        `It seems something went wrong while unlinking. Error: ${err.message}`
      );
      throw err;
    });
};

module.exports = {
  func: unlink,
  description: 'unlink native dependency',
  name: 'unlink <packageName>',
};
