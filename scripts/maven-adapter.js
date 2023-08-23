const utility = require('./utility');
const path = require('path');
const chalk = require("chalk");

const ROOTDIR = utility.getLocalAppSetupPath();
const MAVEN_HOME = utility.getM2DirPath();

const SPACE = utility.getCurrentActiveAccount().space
const ORG = utility.getCurrentActiveAccount().org

async function main() {

    // check if maven is configured
    if (MAVEN_HOME == null || MAVEN_HOME.trim().length <= 0) {
        throw Error("Maven Home not found.");
    }
    console.log("==> Maven Home ", MAVEN_HOME);

    // get application name from cmdline
    const appName = process.argv[2];
    console.log("==> App Name:", appName);

    // get application build info from apps.json
    const appInfo = utility.getAppInfo(appName);
    if (!path.isAbsolute(appInfo.folder)) {
        appInfo.folder = path.join(ROOTDIR, appInfo.folder);
    }
    console.log(`==> App Properties`, appInfo);

    // check if application code is present
    if (!utility.pathExists(appInfo.folder)) {
        throw Error("Run App Folder not found.");
    }

    // run application build command
    console.log(`==> Building App - `, chalk.blue(appInfo["build:cmd"]));
    await process.chdir(appInfo.folder);
    await utility.execute(appInfo["build:cmd"]);

    // application start command
    const MVN_RUN_CMD = appInfo["start:cmd"];

    console.log(`==> setting vcap variables for ${ORG} - ${SPACE}`);

    // set vcap & java start options
    vcapServicesContent = utility.getVcapVariables(ORG, SPACE, appInfo.cfAppName);
    vcapAppContent = utility.getVcapApplication(ORG, SPACE, appInfo.cfAppName);
    process.env['VCAP_SERVICES'] = JSON.stringify(vcapServicesContent);
    process.env['VCAP_APPLICATION'] = JSON.stringify(vcapAppContent);
    // process.env['JAVA_OPTS'] = JVM_ARGS;

    // setting other env variables
    for (const envVar in appInfo.env) {
        process.env[envVar] = appInfo.env[envVar];
    }

    let startFolder = path.join(appInfo.folder, appInfo.path);

    await process.chdir(startFolder);
    await utility.execute(MVN_RUN_CMD);
}


main().catch(e => console.error(e));