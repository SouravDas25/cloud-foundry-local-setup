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
    const JVM_ARGS = appInfo["start:cmd"];

    console.log(`==> setting vcap variables for ${ORG} - ${SPACE}`);

    // set vcap & java start options
    vcapServicesContent = utility.getVcapVariables(ORG, SPACE, appName);
    vcapAppContent = utility.getVcapApplication(ORG, SPACE, appName);
    process.env['VCAP_SERVICES'] = JSON.stringify(vcapServicesContent);
    process.env['VCAP_APPLICATION'] = JSON.stringify(vcapAppContent);
    process.env['JAVA_OPTS'] = JVM_ARGS;

    // setting other env variables
    for (const envVar in appInfo.env) {
        process.env[envVar] = appInfo.env[envVar];
    }

    // war name
    const artifactName = appInfo.artifactName;

    let warPath = path.join(appInfo.folder, appInfo.path, artifactName);
    let tomcatPath = path.join(ROOTDIR, 'deps', 'apache-tomcat-8.5.78');
    // check if war exists
    if (!utility.pathExists(warPath)) {
        throw Error("War file not found.");
    }
    console.log("==> using war file from ", warPath);

    // remove previous war !important
    utility.removeFile(path.join(tomcatPath, 'webapps', artifactName));
    // copy new war to tomcat webapps
    utility.copyFileSync(warPath, path.join(tomcatPath, 'webapps', artifactName))

    // start tomcat
    await process.chdir(path.join(tomcatPath, 'bin'));
    if (utility.isWindowsSystem()) {
        console.log("==> catalina.bat run");
        await utility.execute("catalina.bat run");
    } else {
        console.log("==> sh catalina.sh run");
        await utility.execute("sh catalina.sh run");
    }
}


main().catch(e => console.error(e));