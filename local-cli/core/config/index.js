const path = require('path');

const tvos = require('./tvos');
const findAssets = require('./findAssets');
const wrapCommands = require('./wrapCommands');

const getRNPMConfig = (folder) =>
  require(path.join(folder, './package.json')).rnpm || {};

/**
 * Returns project config from the current working directory
 * @return {Object}
 */
exports.getProjectConfig = function getProjectConfig() {
  const folder = process.cwd();
  const rnpm = getRNPMConfig(folder);

  return Object.assign({}, rnpm, {
    tvos: tvos.projectConfig(folder, rnpm.tvos || {}),
    assets: findAssets(folder, rnpm.assets),
  });
};

/**
 * Returns a dependency config from node_modules/<package_name>
 * @param {String} packageName Dependency name
 * @return {Object}
 */
exports.getDependencyConfig = function getDependencyConfig(packageName) {
  const folder = path.join(process.cwd(), 'node_modules', packageName);
  const rnpm = getRNPMConfig(
    path.join(process.cwd(), 'node_modules', packageName)
  );

  return Object.assign({}, rnpm, {
    tvos: tvos.dependencyConfig(folder, rnpm.tvos || {}),
    assets: findAssets(folder, rnpm.assets),
    commands: wrapCommands(rnpm.commands),
    params: rnpm.params || [],
  });
};
