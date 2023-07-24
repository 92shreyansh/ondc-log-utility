const config = require("./config.js");
const input = require("./input.js");
const log = require("./logger.js");
const { validateSchema, validateData } = require("./validation.js");

const args = process.argv.slice(2);
var configFile = args[0];
if (!configFile || configFile == "") {
  configFile = "./config.yaml";
}

var inputFile = args[1];
if (!inputFile || inputFile == "") {
  inputFile = "./input.yaml";
}

const CONTEXT_META = {
  txn_id_check: { type: "transaction_id", operation: "EQUAL_ALL" },
  domain_check: { type: "domain", operation: "EQUAL_ALL" },
  country_check: { type: "country", operation: "EQUAL_ALL" },
  core_version_check: { type: "core_version", operation: "EQUAL_ALL" },
  bap_id_check: { type: "bap_id", operation: "EQUAL_ALL" },
  bap_uri_check: { type: "bap_uri", operation: "EQUAL_ALL" },
  timestamp_check: { type: "timestamp", operation: "GREATER" },
  bpp_id_check: { type: "bpp_id", operation: "EQUAL" },
};
let logger, equalAll;
async function startUp() {
  await config.loadConfig(configFile);
  let configData = config.getConfig();
  logger = log.init();
  await input.loadInput(inputFile);
  let inputLogs = input.getInput()["logs"];
  const inputFlows = input.getInput()["flow"];
  let contextPayload = {
    //id_List: [],
  };
  for (let api in inputLogs) {
    let payloads = inputLogs[api];
    for (let payload of payloads) {
      let req_body = payload["data"];
      let id = payload["id"];
      const { context } = payload?.data;
      logger.info(
        `Validating Null and empty Value of api ${req_body?.context?.action} id: ${id}`
      );
      let result = await validateData(req_body);
      if (result && result.length != 0) {
        logger.error("Null values in :" + JSON.stringify(req_body));
        logger.error("Validation result :" + JSON.stringify(result));
      } else {
        logger.info(
          `No NULL and empty values are present in api ${req_body?.context?.action} id: ${id}`
        );
      }
      logger.info(
        `Validating schema of of api ${req_body?.context?.action} id: ${id}`
      );
      if (!validateSchema(configData["logs"][api]["schema"], req_body)) {
        logger.error("Schema Failure id: " + id);
      }
      contextPayload = { ...contextPayload, [id]: payload?.data };
    }
  }
  if (Object.keys(contextPayload)?.length) {
    validateFLows(contextPayload, inputFlows);
  }
}

async function validateFLows(contextPayload, inputFlows) {
  try {
    for (flows = 0; flows < inputFlows?.length; flows++) {
      const { id: flowID, id_seq, api_seq } = inputFlows[flows];
      const idSequence = id_seq.split(",");
      const apiSequenceArray = api_seq?.split(",");
      equalAll = undefined;
      if (
        inputFlows[flows]?.id == "message_id" &&
        apiSequenceArray &&
        apiSequenceArray?.length
      ) {
        //validate message_id for search & on_search pair.
        for (let path = 0; path < apiSequenceArray?.length; path++) {
          //if index is even then read next, if odd then skip
          if (!(path % 2)) {
            const sequenceIndexOne = idSequence[path];
            const sequenceIndexTwo = idSequence[path + 1];
            const { context: context } = contextPayload[sequenceIndexOne] || {};
            const { context: onContext } =
              contextPayload[sequenceIndexTwo] || {};
            if (
              context !== undefined &&
              onContext !== undefined &&
              context?.message_id != onContext?.message_id
            ) {
              logger.error(
                `Message id is not same for :${context?.action} & ${onContext?.action}`
              );
            }
          }
        }
      }
      //validate context's items based on idSequence
      for (let sequence = 0; sequence < idSequence?.length; sequence++) {
        let path = idSequence[sequence];
        if (contextPayload[path] && CONTEXT_META[flowID]) {
          const { context } = contextPayload[path];
          await getOperation(CONTEXT_META[flowID], context);
        }
      }
    }
  } catch (error) {
    console.log("Error validating flows", error);
  }
}

function checkEquality(operations, data) {
  if (operations?.operation === "EQUAL" && data?.action === "search") {
    return;
  }
  if (!equalAll) {
    equalAll = data[operations?.type];
  } else if (equalAll != data[operations?.type]) {
    return logger.error(
      `${operations?.operation} Validation Failed :${operations?.type} not matched for ${data?.action}`
    );
  }
}

function compareDate(operations, data) {
  if (!equalAll) {
    equalAll = data[operations?.type];
  } else if (new Date(equalAll) >= new Date(data[operations?.type])) {
    equalAll = data[operations?.type];
    logger.error(
      `GREATER Validation Failed :${operations?.type} not matched for ${data?.action}`
    );
  } else {
    equalAll = data[operations?.type];
  }
}

async function getOperation(operations, data) {
  //EQUAL_ALL== value should be same across.
  //EQUAL== value should be same across except search.
  if (
    operations?.operation === "EQUAL_ALL" ||
    operations?.operation === "EQUAL"
  ) {
    checkEquality(operations, data);
  } else if (operations?.operation === "GREATER") {
    //previous date should be less than current one
    compareDate(operations, data);
  }
}

startUp();
