import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { RealEstateAppFactory } from './artifacts/real_estate/RealEstateAppClient'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.testnet') })

async function batchDeploy() {
    console.log('--- Starting Batch Deployment for ApnaMakan ---')

    // Explicitly use TestNet
    const algorand = AlgorandClient.testNet()

    // Set the signer from the mnemonic in the environment
    const mnemonic = process.env.DEPLOYER_MNEMONIC
    if (!mnemonic) throw new Error('DEPLOYER_MNEMONIC not found in .env.testnet')

    const deployer = await algorand.account.fromMnemonic(mnemonic)

    console.log(`Using Deployer: ${deployer.addr}`)

    const properties = [
        { name: 'Azure Horizons Villa', unit: 'AZURE', price: 1_250_000n },
        { name: 'Midnight Sky Penthouse', unit: 'MIDSKY', price: 2_500_000n },
        { name: 'Silver Pine Chalet', unit: 'SILVER', price: 950_000n },
    ]

    const results = []

    for (const prop of properties) {
        console.log(`\nDeploying: ${prop.name}...`)

        // 1. Create Asset
        const assetCreateResult = await algorand.send.assetCreate({
            sender: deployer.addr,
            total: 1n,
            decimals: 0,
            assetName: prop.name,
            unitName: prop.unit,
        })

        const assetId = BigInt(assetCreateResult.confirmation.assetIndex!)
        console.log(`   ✅ Asset Created: ${assetId}`)

        // 2. Deploy App
        const factory = new RealEstateAppFactory({
            algorand,
            defaultSender: deployer.addr,
        })

        const { appClient } = await factory.deploy({
            appName: prop.name, // Ensure unique app name per property
            onUpdate: 'append',
            onSchemaBreak: 'append',
            createParams: {
                method: 'create',
                args: {
                    assetId,
                    price: prop.price,
                },
            },
        })

        const appId = appClient.appClient.appId
        console.log(`   ✅ App Deployed: ${appId} (Manager for Asset ${assetId})`)
        console.log(`   ✅ App Address: ${appClient.appAddress}`)

        results.push({
            name: prop.name,
            assetId: assetId.toString(),
            appId: appId.toString(),
            appAddress: appClient.appAddress,
            price: prop.price.toString()
        })
    }

    console.log('\n--- BATCH DEPLOYMENT COMPLETE ---')
    const fs = require('fs')
    fs.writeFileSync('deployment_results.json', JSON.stringify(results, null, 2))
    console.log('Results saved to deployment_results.json')
}

batchDeploy().catch(console.error)
