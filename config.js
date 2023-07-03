const fs = require("fs");
const yaml = require("yaml");
const $RefParser = require("json-schema-ref-parser");

var config;

async function loadConfig(filePath) {
  const yamlString = fs.readFileSync(filePath, "utf8");
  const yamlObject = yaml.parse(yamlString);
  config = await $RefParser.dereference(yamlObject);
}

function getConfig() {
  if (!config) {
    loadConfig("./config.yaml");
  }
  return config;
}

module.exports = {
  loadConfig,
  getConfig,
};
