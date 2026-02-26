import {
    Contract,
    GlobalState,
    uint64,
    Uint64,
    Account,
    Asset,
    gtxn,
    assert,
    abimethod,
    Txn,
    Global,
} from '@algorandfoundation/algorand-typescript'

export class RealEstateApp extends Contract {
    /**
     * Global state to track the NFT property
     */
    assetId = GlobalState<uint64>()
    price = GlobalState<uint64>()
    seller = GlobalState<Account>()
    isSold = GlobalState<uint64>({ initialValue: Uint64(0) })

    /**
     * Bootstrap the contract with property details
     * Typically called by the creator/seller
     */
    @abimethod({ onCreate: 'require' })
    create(assetId: Asset, price: uint64): void {
        this.assetId.value = assetId.id
        this.price.value = price
        this.seller.value = Txn.sender
    }

    /**
     * Purchase the NFT
     * Must be grouped with a payment transaction of the correct amount
     */
    buy(payment: gtxn.PaymentTxn): void {
        // 1. Validation
        assert(this.isSold.value === Uint64(0), 'Property already sold')
        assert(payment.receiver === Global.currentApplicationAddress, 'Payment must be sent to contract')
        assert(payment.amount === this.price.value, 'Incorrect payment amount')
        assert(payment.sender === Txn.sender, 'Payment sender must be the buyer')

        // 2. State Update
        this.isSold.value = Uint64(1)
    }
}
