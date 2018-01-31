'use strict';

const _ = require('lodash');
const fs = require('fs');

function disguiseInfo(info) {
  info = _.cloneDeep(info);
  if (info.config.info) {
    for (const path of info.config.info) {
      if (_.has(info, path)) {
        _.set(info, path, '******');
      }
      if (path.indexOf('config') !== -1) {
        const propertiesPath = path.replace('config', 'properties');
        if (_.has(info, propertiesPath)) {
          _.set(info, propertiesPath, '******');
        }
      }
    }
  }
  return info;
}

function getPackage() {
  return require(process.cwd() + '/package.json');
}

function getProperties() {
  let properties = {};
  try {
    properties = require(process.cwd() + '/config/properties.json');
  } catch (e) {}
  return properties;
}

function getVersion(info) {
  let version = info.package.version;
  try {
    version += '-' + fs.readFileSync(process.cwd() + '/REVISION', 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
  return version;
}

function getSummary(info, version, summarize) {
  const summary = {
    version,
    dependencies: {}
  };
  const dependencyKeys = Object.keys(info.package.dependencies).filter(key => key.startsWith('mxd-'));
  for (const dependencyKey of dependencyKeys) {
    const dependency = info.package.dependencies[dependencyKey];
    summary.dependencies[dependencyKey] = dependency.split('#')[1] || dependency;
  }
  if (info.config.logging && info.config.logging.transports) {
    summary.logging = info.config.logging.transports
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

module.exports = (config, app) => {
  if (process.env.MXD_INFO) {
    config.info = JSON.parse(process.env.MXD_INFO);
  }

  const info = {
    config,
    package: getPackage(),
    properties: getProperties()
  };
  const disguisedInfo = disguiseInfo(info);

  app.get('/info/config', (req, res) => {
    res.send(disguisedInfo.config);
  });

  app.get('/info/package', (req, res) => {
    res.send(disguisedInfo.package);
  });

  app.get('/info/properties', (req, res) => {
    res.send(disguisedInfo.properties);
  });

  const version = getVersion(info);
  app.get('/info/version', (req, res) => {
    res.send(version);
  });

  let summary = getSummary(info, version);
  const summaryController = (req, res) => {
    res.send(summary);
  };
  app.get('/info', summaryController);
  app.get('/info/summary', summaryController);

  return summarize => {
    summary = getSummary(info, version, summarize);
  };
};
