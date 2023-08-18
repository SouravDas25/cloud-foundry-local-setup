const utility = require("./utility");

async function main() {
    const co = await utility.cfLogin(utility.getCurrentActiveAccount().apiEndpoint,
        utility.getCurrentActiveAccount().org,
        utility.getCurrentActiveAccount().space);
    if (co.code !== 0) {
        throw new Error("Cf Login Failed");
    }
}

main().catch(e => console.error(e));