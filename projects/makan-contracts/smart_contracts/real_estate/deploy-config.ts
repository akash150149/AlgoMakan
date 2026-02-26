import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { RealEstateAppFactory } from '../artifacts/real_estate/RealEstateAppClient'

export async function deploy() {
    console.log('=== Deploying RealEstateApp ===')

    const algorand = AlgorandClient.fromEnvironment()
    const deployer = await algorand.account.fromEnvironment('DEPLOYER')

    const factory = new RealEstateAppFactory({
        algorand,
        defaultSender: deployer.addr,
    })

    // Dummy values for demonstration - in production these would come from env or params
    const assetId = 755121764n
    const price = 450_000n

    const { appClient, result } = await factory.deploy({
        onUpdate: 'append',
        onSchemaBreak: 'append',
        createParams: {
            method: 'create',
            args: {
                assetId,
                price,
            },
        },
    })

    console.log(
        `Deployed RealEstateApp (${appClient.appClient.appId}) for Asset ${assetId} at price ${price}`,
    )
}
