const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname);
const googleServicesPath = path.join(projectRoot, 'google-services.json');
const fileExists = fs.existsSync(googleServicesPath);

const base = require('./app.json');
const { googleServicesFile: _omit, ...androidRest } = base.expo.android || {};
const config = {
  ...base,
  expo: {
    ...base.expo,
    android: {
      ...androidRest,
      ...(fileExists ? { googleServicesFile: './google-services.json' } : {}),
    },
  },
};

module.exports = config;
