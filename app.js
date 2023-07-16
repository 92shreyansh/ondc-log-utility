const config = require("./config.js");
const input = require("./input.js");
const log = require("./logger.js");
const { validateSchema, validateData } = require("./validation.js");


const args = process.argv.slice(2);
var configFile = args[0]
if (!configFile || configFile == "") {
    configFile = "./config.yaml"
}

var inputFile = args[1]
if (!inputFile || inputFile == "") {
    inputFile = "./input.yaml"
}

async function startUp() {
    await config.loadConfig(configFile);
    // console.log(config.getConfig())
    let configData = config.getConfig();
    const logger = log.init();
    await input.loadInput(inputFile);
    // console.log(input.getInput())
    let inputLogs = input.getInput()["logs"];
    for (let api in inputLogs) {
        let payloads = inputLogs[api]
        for (let payload of payloads) {
            // console.log(payload)
            let req_body = payload["data"]
            let id = payload["id"]
            logger.info(`Validating Null and empty Value of api ${req_body?.context?.action} id: ${id}`);
            let result = await validateData(req_body)
            if (result && result.length != 0 ) {
                logger.error("Null values in :" + JSON.stringify(req_body))
                logger.error("Validation result :" + JSON.stringify(result))
            } else {
                logger.info(`No NULL and empty values are present in api ${req_body?.context?.action} id: ${id}`)
            }
            logger.info(`Validating schema of of api ${req_body?.context?.action} id: ${id}`);
            if (!validateSchema(configData["logs"][api]["schema"], req_body)) {
                logger.error("Schema Failure id: "+id)
            }
        }
    }
}

startUp()

