//licensce extrator

async function getLicense(componentName) {
  const axios = require('axios');
  const { data } = await axios.get(`https://registry.npmjs.org/${componentName}`);
  return data.license || 'UNKNOWN';
}

module.exports = { getLicense };