const algosdk = require('algosdk');

const algodClient = new algosdk.Algodv2(
    "",
    "https://testnet-api.algonode.cloud",
    ""
);

const appIds = [756218220, 756222265, 756222269, 756222282];

async function checkApps() {
    const results = {};
    for (const appId of appIds) {
        try {
            const appInfo = await algodClient.getApplicationByID(appId).do();
            const globalState = appInfo.params['global-state'] || [];

            const state = {};
            globalState.forEach(s => {
                const key = Buffer.from(s.key, 'base64').toString();
                const value = s.value.type === 1 ? Buffer.from(s.value.bytes, 'base64').toString('hex') : s.value.uint;
                state[key] = value;
            });

            results[appId] = state;
        } catch (err) {
            results[appId] = { error: err.message };
        }
    }
    console.log(JSON.stringify(results, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

checkApps();
