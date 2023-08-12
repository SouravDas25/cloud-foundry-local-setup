const approuter = require('@sap/approuter');
const pullToken = require("./pull-token");
const utility = require("../scripts/utility");
const destinations = require("./destinations.json");


async function setupAppRouter() {
    const bearerToken = await pullToken.pullXsuaaBearerToken();
    const ar = approuter();
    ar.beforeRequestHandler.use(function tokenMiddleware(req, res, next) {
        if (req.internalUrl && req.internalUrl.destination && req.internalUrl.destination.forwardAuthToken === true) {
            console.log("bearer token attached to", req.internalUrl.destination.url);
            req.headers["Authorization"] = "Bearer " + bearerToken;
        }
        next();
    });
    if (bearerToken != null) {
        ar.start();
    } else {
        console.log(`environment setup failed.`);
    }
}

async function main() {

    const ROOTDIR = utility.getLocalAppSetupPath();
    const SPACE = utility.getCurrentActiveAccount().space
    const ORG = utility.getCurrentActiveAccount().org

    const appInfo = utility.getAppInfo("app-router");

    vcapServicesContent = utility.getVcapVariables(ORG, SPACE, appInfo.cfAppName);
    vcapAppContent = utility.getVcapApplication(ORG, SPACE, appInfo.cfAppName);

    const filteredContent = {
        "xsuaa": vcapServicesContent["xsuaa"]
    }

    await pullToken.setupXsuaaEnvironment(vcapServicesContent);

    process.env['VCAP_SERVICES'] = JSON.stringify(filteredContent);
    process.env['VCAP_APPLICATION'] = JSON.stringify(vcapAppContent);
    process.env['destinations'] = JSON.stringify(destinations);

    await setupAppRouter();

    await utility.execute("open http://localhost:9200");
}

main().catch(e => console.log(e));