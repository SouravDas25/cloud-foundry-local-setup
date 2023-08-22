#!/usr/bin/env node

const fs = require('fs');
const {exec} = require("child_process")
const path = require('path');
const axios = require('axios');
const accountInfo = require("./../account-info.json")
const appJson = require("./../apps.json")

const utility = require('./utility');

function getOrg(targetOutPut) {
    const regex = /[orgORG]{3}[\\s:]*(.*)/gm;
    regExpExecArray = regex.exec(targetOutPut);
    if (regExpExecArray == null || regExpExecArray.length < 2) {
        console.log(regExpExecArray);
        throw Error("Endpoint not in correct format");
    }
    let org = regExpExecArray[1].trim();
    return org;
}

function getSpace(targetOutPut) {
    const regex = /[spaceSPACE]{5}[\\s:]*(.*)/gm;
    regExpExecArray = regex.exec(targetOutPut);
    if (regExpExecArray == null || regExpExecArray.length < 2) {
        console.log(regExpExecArray);
        throw Error("Endpoint not in correct format");
    }
    let space = regExpExecArray[1].trim();
    return space;
}

async function getOrgGuid(org, apiEndpoint, bearerToken) {
    let headers = {
        Authorization: bearerToken
    }
    let response = await axios.get(apiEndpoint + `/v2/organizations`, {headers: headers});
    response = response.data;
    if (response.resources.length > 0) {
        for (const res of response.resources) {
            if (res.entity.name === org) {
                return res.metadata.guid;
            }
        }
    }
    return null;
}

async function getSpaceGuid(space, orgGuid, apiEndpoint, bearerToken) {
    let headers = {
        Authorization: bearerToken
    }
    let response = await axios.get(apiEndpoint + `/v2/spaces`, {headers: headers});
    response = response.data;
    if (response.resources.length > 0) {
        for (const res of response.resources) {
            if (res.entity.name === space && res.entity.organization_guid === orgGuid) {
                return res.metadata.guid;
            }
        }
    }
    return null;
}

async function getAppGuid(app, spaceGuid, apiEndpoint, bearerToken) {
    let headers = {
        Authorization: bearerToken
    }
    let response = await axios.get(apiEndpoint + `/v2/spaces/${spaceGuid}/apps`, {headers: headers});
    response = response.data;
    if (response.resources.length > 0) {
        let tmpGuid = null;
        for (const res of response.resources) {
            if (res.entity.name.includes(app)) {
                if ((tmpGuid != null && res.entity.state === "STARTED") || (tmpGuid == null)) {
                    tmpGuid = res.metadata.guid;
                }
            }
        }
        return tmpGuid;
    }
    return null;
}

function getApiEndpoint(targetOutPut) {
    const regex = /^[apiAPI]{3}[\s]*[endpointENDPOINT]{8}[\s:]*(.*)$/gm;
    regExpExecArray = regex.exec(targetOutPut);
    if (regExpExecArray == null || regExpExecArray.length < 2) {
        console.log(regExpExecArray);
        throw Error("Endpoint not in correct format");
    }
    let endpoint = regExpExecArray[1].trim();
    return endpoint;
}

async function getVcapVariables(appGuid, apiEndpoint, bearerToken) {
    let headers = {
        Authorization: bearerToken
    }
    let response = await axios.get(apiEndpoint + `/v2/apps/${appGuid}/env`, {headers: headers});
    response = response.data;
    let vcap = response.system_env_json.VCAP_SERVICES;
    let vcapApp = response.application_env_json.VCAP_APPLICATION;
    return {
        VCAP_SERVICES: vcap,
        VCAP_APPLICATION: vcapApp
    };
}

async function createDirectories(org, space) {
    utility.createDirectories(`./../accounts-env/${org}/${space}`);
}

async function saveCfEnvironment(org, space, spaceGuid, apiEndpoint, bearerToken, appname) {

    console.log(`==> fetching cf app ${appname} --guid`);
    let appGuid = await getAppGuid(appname, spaceGuid, apiEndpoint, bearerToken);
    if (appGuid == null) {
        console.log("CF API calls failed for ", appname);
        return;
    }

    console.log(`==> downloading cf env ${appname}`);
    let vcap = await getVcapVariables(appGuid, apiEndpoint, bearerToken);
    if (vcap.VCAP_SERVICES == null || vcap.VCAP_APPLICATION == null) {
        console.log("CF API calls failed for ", appname);
        return;
    }

    await createDirectories(org, space);

    console.log(`==> persisting ${appname} environment.`);

    await fs.writeFileSync(path.normalize(`./../accounts-env/${org}/${space}/${appname}-vcap.json`), JSON.stringify(vcap.VCAP_SERVICES, null, 4), 'utf-8');
    await fs.writeFileSync(path.normalize(`./../accounts-env/${org}/${space}/${appname}-vcap-application.json`), JSON.stringify(vcap.VCAP_APPLICATION, null, 4), 'utf-8');

}

async function main() {

    // const co = await utility.cfLogin(utility.getCurrentActiveAccount().apiEndpoint,
    //     utility.getCurrentActiveAccount().org,
    //     utility.getCurrentActiveAccount().space);
    //
    // if (co.code !== 0) {
    //     throw new Error("Cf Login Failed");
    // }

    console.log("==> getting cf oauth-token");
    let bearerToken = await utility.execute(`cf oauth-token`);
    bearerToken = bearerToken.replace(/\r?\n|\r/g, " ");
    if (!(/[B|b]earer[\s]+(.*)/g.test(bearerToken))) {
        throw new Error("Invalid bearer token");
    }
    // let targetOutput = await utility.execute(`cf target`);
    let org = utility.getCurrentActiveAccount().org;
    let space = utility.getCurrentActiveAccount().space;
    let apiEndpoint = utility.getCurrentActiveAccount().apiEndpoint;

    console.log("==> Org", org);
    console.log("==> Space", space);

    console.log(`==> fetching cf org ${org} --guid`);
    let orgGuid = await getOrgGuid(org, apiEndpoint, bearerToken);
    console.log(`==> fetching cf space ${space} --guid`);
    let spaceGuid = await getSpaceGuid(space, orgGuid, apiEndpoint, bearerToken);

    if (spaceGuid == null) {
        throw new Error("CF API calls failed");
    }

    await createDirectories(org, space);

    for (const app in appJson) {
        const appInfo = appJson[app];
        await saveCfEnvironment(org, space, spaceGuid, apiEndpoint, bearerToken, appInfo.cfAppName);
    }

    let key = org + "-" + space;
    let account = accountInfo[key];
    if (account == null) {
        account = {}
        accountInfo[key] = account;
    }

    account.org = org;
    account.space = space;
    account.apiEndpoint = apiEndpoint;
    account.subdomain = org;

    console.log("==> updating account-info file.");

    await fs.writeFileSync(`./../account-info.json`, JSON.stringify(accountInfo, null, 4), 'utf-8');
}

main().catch(e => console.error(e));