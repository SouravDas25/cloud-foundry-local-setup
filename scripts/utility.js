const fs = require('fs');
const {spawn} = require("child_process");
const path = require('path');
const accountInfo = require('./../account-info.json');
const axios = require("axios");
const shell = require('shelljs');
const env = require('./../env.json');
const appInfo = require("./../apps.json")
const https = require("https");
const defaultUser = env.defaultUser;

const authTypes = {
    clientSecret: 1,
    certificate: 2
}

const ROOTDIR = path.dirname(__dirname);

module.exports = {

    customShell: function (cmd, args, printOutput = true) {
        // console.info("executing: ", cmd);
        if (args == null) {
            let split = cmd.split(" ");
            cmd = split[0]
            args = split.slice(1);
        }
        console.info("executing: ", cmd, args);
        return new Promise((resolve, reject) => {

            const cmdProcess = spawn(cmd, args, {shell: true});
            let output = "";
            let that = this;
            that.resolve = resolve;

            cmdProcess.stdout.on("data", data => {
                output += `${data}`;
            });

            if (printOutput) {
                cmdProcess.stdout.pipe(process.stdout);
            }


            cmdProcess.on("close", code => {
                that.resolve(output);
            });
        });
    },

    standardShell: function (command) {
        return shell.exec(command, {})
    },

    pathExists: function (path) {
        return fs.existsSync(path);
    },

    execute: async function (cmd, args) {
        if (env.shell.useCustom === false) {
            return this.standardShell(cmd, args);
        }
        return this.customShell(cmd, args);
    },

    createDirectories: function (pathname) {
        const __dirname = path.resolve();
        pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z0-9]+|\/$/g, '');
        fs.mkdirSync(path.resolve(__dirname, pathname), {recursive: true}, e => {
            if (e) {
                console.error(e);
            } else {
                console.log('Success');
            }
        });
    },

    getLocalAppSetupPath: function () {
        return path.dirname(__dirname);
    },

    getM2DirPath: function () {
        return process.env.HOME + "/.m2";
    },

    getCurrentActiveAccount: function () {
        return accountInfo[env.activeAccount];
    },

    getAppInfo: function (appName) {
        return appInfo[appName];
    },

    getVcapVariables: function (org, space, appName) {
        let vcapCredStr = path.normalize(`${ROOTDIR}/accounts-env/${org}/${space}/${appName}-vcap.json`)
        vcapCredStr = fs.readFileSync(vcapCredStr, 'utf-8');
        return JSON.parse(vcapCredStr);
    },

    getVcapApplication: function (org, space, appName) {
        let vcapCredStr = path.normalize(`${ROOTDIR}/accounts-env/${org}/${space}/${appName}-vcap-application.json`)
        vcapCredStr = fs.readFileSync(vcapCredStr, 'utf-8');
        return JSON.parse(vcapCredStr);
    },

    getServiceFromVcap: function (vcapVariables, serviceType, serviceName = null) {
        if (vcapVariables.hasOwnProperty("VCAP_SERVICES")) {
            vcapVariables = vcapVariables["VCAP_SERVICES"];
        }

        if (vcapVariables.hasOwnProperty(serviceType)) {
            if (vcapVariables[serviceType].length > 0) {
                if (serviceName == null) {
                    return vcapVariables[serviceType][0];
                } else {
                    for (const service of vcapVariables[serviceType]) {
                        if (service.name === serviceName) {
                            return service;
                        }
                    }
                }
            }
        }
        return null;
    },

    copyFileSync: function (source, target) {

        let targetFile = target;

        // If target is a directory, a new file with the same name will be created
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }

        fs.writeFileSync(targetFile, fs.readFileSync(source));
    },

    getAllFiles: function (source, ext, Outfiles) {

        let that = this;
        if (fs.lstatSync(source).isDirectory()) {
            let files = fs.readdirSync(source);
            files.forEach(function (file) {

                let curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    that.getAllFiles(curSource, ext, Outfiles);
                } else {
                    if (file.endsWith(ext)) {
                        Outfiles.push(curSource);
                    }
                }
            });
        }
    },

    copyFilesRecursively: function (source, target, ext) {
        let files = [];
        this.getAllFiles(source, ext, files);
        let that = this;

        let targetFolder = path.resolve(target);
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        files.forEach(file => {
            that.copyFileSync(file, targetFolder);
        })

    },

    copyFolderRecursiveSync: function (source, target, ext) {
        let files = [];

        let that = this;

        // Check if folder needs to be created or integrated
        let targetFolder = path.join(target, path.basename(source));
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        // Copy
        if (fs.lstatSync(source).isDirectory()) {
            files = fs.readdirSync(source);
            files.forEach(function (file) {

                let curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    that.copyFolderRecursiveSync(curSource, targetFolder, ext);
                } else {
                    if (file.endsWith(ext)) {
                        that.copyFileSync(curSource, targetFolder);
                    }
                }
            });
        }
    },

    cfLogin: async function (endPoint, org, space, username = null, password = null) {

        if (username === null) {
            username = defaultUser.username;
            password = defaultUser.password;
        }

        const command = `cf login -a ${endPoint} -u ${username} -p ${password} -o ${org} -s ${space}`
        return await this.execute(command);
    },

    toHeaders: function (auth) {
        return {
            Authorization: auth
        };
    },

    createBasicAuthHeaders: function (username, password) {
        let authentication = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
        return this.toHeaders(authentication);
    },

    createOAuthBearerHeaders: function (accessToken) {
        let authentication = 'Bearer ' + accessToken;
        return this.toHeaders(authentication);
    },

    getAccessToken: async function (oauthUrl, clientId, clientSecret) {
        let headers = this.createBasicAuthHeaders(clientId, clientSecret);
        headers['Accept'] = "application/json";

        let response = await axios.get(oauthUrl, {headers: headers});
        return response.data["access_token"]
    },

    isWindowsSystem: function () {
        return process.platform === "win32" || process.platform === "win64";
    },


    removeFile: function (fileAbsPath) {
        if (this.pathExists(fileAbsPath)) {
            fs.unlinkSync(fileAbsPath);
        }
    },

    checkMaven: function () {
        const MAVEN_HOME = this.getM2DirPath();
        if (MAVEN_HOME == null || MAVEN_HOME.trim().length <= 0) {
            throw Error("Maven Home not found.");
        }
        console.log("Maven Home ", MAVEN_HOME);
    },

    getAccessTokenViaCred: async function (credentials) {
        if (this.getAuthType(credentials) === authTypes.certificate) {
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false, // (NOTE: this will disable client verification)
                cert: credentials.certificate,
                key: credentials.key
            })
            const headers = {'Accept': "application/json"};
            const oAuthUrl = credentials.certurl + "/oauth/token";
            const axiosInstance = axios.create({httpsAgent});
            const params = new URLSearchParams();
            params.append("client_id", credentials.clientid)
            params.append("grant_type", "client_credentials")
            const response = await axiosInstance.post(oAuthUrl, params, {headers: headers});
            return response.data["access_token"]
        } else {
            let headers = this.createBasicAuthHeaders(credentials.clientId, credentials.clientSecret);
            headers['Accept'] = "application/json";
            let oauthUrl = credentials.url + "/oauth/token?grant_type=client_credentials&response_type=token";
            let response = await axios.get(oauthUrl, {headers: headers});
            return response.data["access_token"]
        }
    },

    getAuthType: function (credentials) {
        if (credentials.hasOwnProperty("certurl")) {
            return authTypes.certificate;
        }
        return authTypes.clientSecret;
    },

}