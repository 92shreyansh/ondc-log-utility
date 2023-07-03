
const Ajv = require("ajv");
const ajv = new Ajv({
  allErrors: true,
  strict: "log",
});
const addFormats = require("ajv-formats");
addFormats(ajv);
require("ajv-errors")(ajv);
const log = require("./logger.js");
//schema validation

var logger;

async function validateData(data) {
  logger = log.init();
  let result = [];
  // Check for empty objects
  if (Object.keys(data).length === 0 && data.constructor === Object) {
    logger.debug(" Key: "+ data + " is empty object")
    result.push("Key: "+ data + " is empty object")
  } else {
    // Check for null values
    for (const key in data) {
      if (data[key] === null) {
        logger.debug(" Key: "+ key + " is null")
        result.push("Key: "+ key + " is null")
      } else if (Array.isArray(data[key])) {
        if(data[key].length === 0){
          logger.debug(" Key: "+ key + " is empty array")
          result.push("Key: "+ key + " is empty array")
        } else {
          for(let o of data[key]){
            let subResult = await validateData(o);
            result = result.concat(subResult);
          }
        }
      } else if (data[key].constructor === Object) {
        let subResult = await validateData(data[key]);
        result = result.concat(subResult);
      }
    }
  }
  return result;
}

const validateSchema = async (schema, req_body) => {
  logger = log.init();
  logger.info(
    `Inside schema validation service for ${req_body?.context?.action} api`
  );
  try {
    // console.log(JSON.stringify(schema))
    // console.log(JSON.stringify(req_body))
    const validate = ajv.compile(schema);
    const valid = validate(req_body);
    if (!valid) {
      let error_list = validate.errors;
      logger.error("Schema validation : FAIL");
      logger.error("Validating Failed Payload: "+JSON.stringify(req_body))
      logger.error("Validating Failed Error: "+ JSON.stringify(error_list));
      return false;
    } else {
      logger.info("Schema validation : SUCCESS");
      return true;
    }
  } catch (error) {
    logger.error(error);
  }
};


module.exports = { validateSchema, validateData };
