const algosdk = require('algosdk');

const algodClient = new algosdk.Algodv2(
    "",
    "https://testnet-api.algonode.cloud",
    ""
);

const appIds = [756218220, 756222265, 756222269, 756222282];

async function checkApps() {
    for (const appId of appIds) {
        try {
            const appInfo = await algodClient.getApplicationByID(appId).do();
            const globalState = appInfo.params['global-state'] || [];

            let isSold = 0;
            // Key "isSold" in base64 is "aXNTb2xk"
            const soldState = globalState.find(s => s.key === 'aXNTb2xk');
            if (soldState) {
                isSold = soldState.value.uint;
            }

            console.log(`App ID ${appId}: isSold = ${isSold}`);
        } catch (err) {
            console.error(`Error fetching App ID ${appId}:`, err.message);
        }
    }
}

checkApps();
