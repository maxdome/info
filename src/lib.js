'use strict';

const _ = require('lodash');
const fs = require('fs');

function getConfig(config) {
  config = _.cloneDeep(config);
  if (config.info) {
    for (const path of config.info) {
      if (_.has(config, path)) {
        _.set(config, path, '******');
      }
    }
  }
  return config;
}

function getPackage() {
  return require(process.cwd() + '/package.json');
}

function getVersion(packageJson) {
  let version = packageJson.version;
  try {
    version += '-' + fs.readFileSync(process.cwd() + '/REVISION', 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
  return version;
}

function getSummary(config, packageJson, version, summarize) {
  const summary = {
    version,
    dependencies: {}
  };
  const dependencyKeys = Object.keys(packageJson.dependencies).filter(key => key.startsWith('mxd-'));
  for (const dependencyKey of dependencyKeys) {
    const dependency = packageJson.dependencies[dependencyKey];
    summary.dependencies[dependencyKey] = dependency.split('#')[1] || dependency;
  }
  if (config.logging && config.logging.transports) {
    summary.logging = config.logging.transports
      .filter(function(transport) {
        return transport.type === 'File';
      })
      .map(function (transport) {
        return { level: transport.options.level, filename: transport.options.filename };
      });
  }
  if (summarize) {
    summarize(summary);
  }
  return summary;
}

module.exports = (config) => (app, summarize) => {
  if (process.env.MXD_INFO) {
    config.info = JSON.parse(process.env.MXD_INFO);
  }

  const disguisedConfig = getConfig(config);
  app.get('/info/config', (req, res) => {
    res.send(disguisedConfig);
  });

  const packageJson = getPackage();
  app.get('/info/package', (req, res) => {
    res.send(packageJson);
  });

  const version = getVersion(packageJson);
  app.get('/info/version', (req, res) => {
    res.send(version);
  });

  const summary = getSummary(config, packageJson, version, summarize);
  app.get('/info/summary', (req, res) => {
    res.send(summary);
  });
};
