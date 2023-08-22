#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');
const prompt = require('prompt');
const utility = require('./../scripts/utility');
const https = require("https");
const ENV = require("../env.json")

const authTypes = {
    clientSecret: 1,
    certificate: 2
}

const CAA = utility.getCurrentActiveAccount();

const properties = [
    {
        name: 'subdomain',
        validator: /^[a-zA-Z0-9@\._\s\-]+$/,
        description: "Consumer Subdomain",
        warning: 'Consumer Subdomain must be only contain alphanumerics',
        required: false,
        default: CAA.subdomain
    },
    {
        name: 'username',
        validator: /^[a-zA-Z0-9@\._\s\-]+$/,
        description: "Email or UserId",
        warning: 'Username must be only email or i-number',
        default: ""
    },
    {
        name: 'password',
        description: "password",
        hidden: true,
        default: ""
    }
];

module.exports = {

    xsuaaCredentials: null,
    tokenEnv: null,

    setupXsuaaEnvironment: async function (VCAP_SERVICE) {
        let xsuaaService = utility.getServiceFromVcap(VCAP_SERVICE, "xsuaa");
        if (xsuaaService == null || xsuaaService.credentials == null) {
            throw Error("Xsuaa credentials not found.");
        }
        this.xsuaaCredentials = xsuaaService.credentials;

        if (fs.existsSync('env.token.json')) {
            this.tokenEnv = JSON.parse(fs.readFileSync('env.token.json', 'utf-8'));
        }
    },

    getAuthType: function (credentialType) {
        switch (credentialType) {
            case "instance-secret":
                return authTypes.clientSecret;
            case "x509":
                return authTypes.certificate;
            default:
                return authTypes.clientSecret;
        }
    },

    getTenantSpecificUrl: function (subdomain, url) {
        const hostRegex = /^https:\/\/([^\.]*)\.(.[^\/]*)/gm;
        const regExpExecArray = hostRegex.exec(url);
        if (regExpExecArray == null || regExpExecArray.length < 3) {
            throw Error("Xsuaa Host Url Not Configured");
        }
        let host = regExpExecArray[2]
        return `https://${subdomain}.${host}`
    },

    prepareRequest: function () {

        const request = {
            url: this.xsuaaCredentials.url,
            axiosInstance: axios,
            type: this.getAuthType(this.xsuaaCredentials["credential-type"]),
            body: {
                client_id: this.xsuaaCredentials.clientid,
            },
            subdomain: CAA.subdomain.trim()
        }
        if (request.type === authTypes.clientSecret) {
            request.body.client_secret = this.xsuaaCredentials.clientsecret;
            request.url = this.xsuaaCredentials.url;
            request.axiosInstance = axios;
        } else {
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false, // (NOTE: this will disable client verification)
                cert: this.xsuaaCredentials.certificate,
                key: this.xsuaaCredentials.key
            })
            request.url = this.xsuaaCredentials.certurl;
            request.axiosInstance = axios.create({httpsAgent});
        }
        return request;
    },

    fetchXsuaaTokenWithPassword: async function () {
        prompt.start();
        let result = await prompt.get(properties);
        prompt.stop();
        const request = this.prepareRequest();
        request.body.grant_type = "password";
        request.body.username = result.username.trim();
        request.body.password = result.password.trim();
        try {
            const params = new URLSearchParams();
            for (let key in request.body) {
                params.append(key, request.body[key]);
            }
            const oAuthUrl = this.getTenantSpecificUrl(result.subdomain.trim(), request.url) + "/oauth/token";
            const axiosInstance = request.axiosInstance;
            const response = await axiosInstance.post(oAuthUrl, params);
            if (response.data.hasOwnProperty("refresh_token")) {
                response.data.oAuthUrl = oAuthUrl;
                response.data.authType = request.type;
                fs.writeFileSync("env.token.json", JSON.stringify(response.data, null, 4), 'utf-8');
            }
            return response.data.access_token;
        } catch (error) {
            console.error("oauth authentication ", error.message, error.response.data);
        }
        return null;
    },

    fetchXsuaaWithRefreshToken: async function (refreshToken) {
        const request = this.prepareRequest();
        request.body.grant_type = "refresh_token";
        request.body.refresh_token = refreshToken;
        try {
            const params = new URLSearchParams();
            for (let key in request.body) {
                params.append(key, request.body[key]);
            }
            const oAuthUrl = this.getTenantSpecificUrl(request.subdomain, request.url) + "/oauth/token";
            const response = await request.axiosInstance.post(oAuthUrl, params);
            return response.data.access_token;
        } catch (error) {
            console.error("refresh token expired");
        }
        return null;
    },

    pullXsuaaBearerToken: async function () {
        // await this.setupXsuaaEnvironment();
        console.log("[session-management] setting up session with identityzone : ", this.xsuaaCredentials.identityzone);
        let token = null;
        if (this.tokenEnv != null && this.tokenEnv.hasOwnProperty("refresh_token")) {
            token = await this.fetchXsuaaWithRefreshToken(this.tokenEnv.refresh_token);
        }
        if (token == null) {
            token = await this.fetchXsuaaTokenWithPassword();
        }
        console.log("[session-management] session created.");
        return token;
    }
}
