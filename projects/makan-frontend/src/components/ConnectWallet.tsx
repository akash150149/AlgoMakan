import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  if (!openModal) return null;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="section-title" style={{ fontSize: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          {activeAddress ? 'Your Account' : 'Connect Wallet'}
        </h3>

        <div className="wallet-list">
          {activeAddress && (
            <>
              <Account />
              <div className="divider" />
            </>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', width: '100%', padding: '0.75rem 1rem' }}
                key={`provider-${wallet.id}`}
                onClick={() => {
                  wallet.connect()
                  closeModal()
                }}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    style={{ objectFit: 'contain', width: '24px', height: '24px' }}
                  />
                )}
                <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
              </button>
            ))}
        </div>

        <div className="flex flex-col gap-2 mt-8">
          {activeAddress && (
            <button
              className="btn btn-warning w-full"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                  closeModal()
                }
              }}
            >
              Disconnect Wallet
            </button>
          )}

          <button
            data-test-id="close-wallet-modal"
            className="btn btn-outline w-full"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
export default ConnectWallet
