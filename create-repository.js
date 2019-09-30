const rp = require("request-promise");
const fs = require("fs");
const csv = require("csv");
const csvSync = require("csv-parse/lib/sync"); // requiring sync module
const log4js = require("log4js");

log4js.configure({
  appenders: { file: { type: "file", filename: "logs/file.log" } },
  categories: {
    default: { appenders: ["file"], level: "debug" }
  }
});

const logger = log4js.getLogger();
logger.level = "all";

/**
 * CSVファイルを読み込み、配列を作成します。
 * @param {filename} str - CSV file name
 * @returns {Array} 配列を返す
 */
async function readCsv(filename) {
  logger.debug("[readCsv] filename: " + filename);

  const result = fs.readFileSync(filename);
  const records = csvSync(result);

  logger.debug("[readCsv] records: " + records);
  logger.info("[readCsv] finish");
  return records;
}

/**
 * リポジトリを作成します。
 * @param {repositoryName} str - Repository name
 * @param {language} str - Main language(.gitignore pattern) - Optional
 */
async function createRepository({repositoryName, language}) {
  logger.info(
    "[createRepository] repositoryName: " +
      repositoryName +
      ", language: " +
      language
  );

  let gitignoreTemplate;
  let options;

  // language = `${language.charAt(0).toUpperCase()}${language.slice(1).toLowerCase()}`;

  if (language.toLowerCase() == "java") {
    gitignoreTemplate = "Java";
  }

  if (gitignoreTemplate == null) {
    options = {
      method: "POST",
      uri: "https://api.github.com/user/repos",
      headers: {
        "Content-type": "application/json",
        "Authorization": "token xxxx",
        "User-Agent": "Awesome-Octocat-App"
      },
      json: {
        name: repositoryName,
        // private: true,
        auto_init: true
      }
    };
  } else {
    options = {
      method: "POST",
      uri: "https://api.github.com/user/repos",
      headers: {
        "Content-type": "application/json",
        Authorization: "token xxxx",
        "User-Agent": "Awesome-Octocat-App"
      },
      json: {
        name: repositoryName,
        // private: true,
        auto_init: true,
        gitignore_template: "Java"
      }
    };
  }

  let result;

  try {
    result = await rp(options);
    logger.debug("[createRepository] result: " + result);
  } catch (e) {
    logger.error("[postRequest] NG - " + options.uri);  
    logger.error("[postRequest] NG - " + e);
  }
}

/**
 * ブランチを保護します。
 * @param {repositoryName} str - Repository name
 * @param {branches} Array - branche name
 */
async function protectBranches(repositoryName, branches) {
  // PUT /repos/:owner/:repo/branches/:branch/protection
  logger.info("[protectBranches] branches: " + branches);

  for (let branch of branches) {
    logger.debug("[protectBranches] branch: " + branch);
    let options;
    options = {
      method: "PUT",
      uri:
        "https://api.github.com/repos/pst3456/" +
        repositoryName +
        "/branches/" +
        branch +
        "/protection",
      headers: {
        "Content-type": "application/json",
        "Authorization": "token xxxx",
        "User-Agent": "Awesome-Octocat-App",
        "Accept": "application/vnd.github.luke-cage-preview+json"
      },
      json: {
        required_status_checks: null,
        enforce_admins: true,
        required_pull_request_reviews: {
          required_approving_review_count: 1
        },
        restrictions: null
      }
    };

    let result;

    try {
        result = await rp(options);
        logger.debug("[protectBranches] request result: " + result);
    } catch (e) {
        logger.error("[protectBranches] NG1 - " + options.uri);
        logger.error("[protectBranches] NG2 - " + e);
    }
  }
}

async function main() {
  logger.info("Start");
  // read csv file

  const filename = "/Users/sn/git/github-api-test/test.csv";
  const res = await readCsv(filename);
  const branches = ["master", "develop", "Release-*"];

  logger.debug("res :" + res);

  const f = async (reponame, branch) => {
    if (!branch) {
        await createRepository(reponame, "");
      } else {
        await createRepository(reponame, branch);
      }
  
      // checkout develop
      await protectBranches(reponame, branches);  
  };

  console.log(f);

  const functions = [];

  // create repositories
  for (let value of res) {
    functions.push(f(value[0], value[1]));
  }

  await Promise.all(functions);
}

/*
async function main() {
    logger.info("Start");
    // read csv file
  
    const filename = "/Users/sn/git/github-api-test/test.csv";
    const res = await readCsv(filename);
    const branches = ["master", "develop", "Release-*"];
  
    logger.debug("res :" + res);
  
    // create repositories
    for (let value of res) {
      logger.debug(value);
      console.log(value[0]);
      if (value.length == 1) {
        await createRepository(value[0], "");
      } else {
        await createRepository(value[0], value[1]);
      }
  
      // checkout develop
      await protectBranches(value[0], branches);
    }
  }
*/
  

main();
