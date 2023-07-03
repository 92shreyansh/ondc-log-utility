const fs = require("fs");
const yaml = require("yaml");
const $RefParser = require("json-schema-ref-parser");

var input;

async function loadInput(filePath) {
  // const filePath = "./input.yaml";
  const yamlString = fs.readFileSync(filePath, "utf8");
  const yamlObject = yaml.parse(yamlString);
  // input = yamlObject;
  input = await $RefParser.dereference(yamlObject);
}

function getInput() {
  if (!input) {
    loadInput("./input.yaml");
  }
  return input;
}

module.exports = {
  loadInput,
  getInput,
};
