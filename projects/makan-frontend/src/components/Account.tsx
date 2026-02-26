import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const Account = () => {
  const { activeAddress } = useWallet()
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network === '' ? 'LocalNet' : algoConfig.network.charAt(0).toUpperCase() + algoConfig.network.slice(1).toLowerCase()
  }, [algoConfig.network])

  return (
    <div className="account-info-card">
      <div className="flex flex-col gap-2">
        <label className="account-label">Connected Address</label>
        <a
          className="account-address-link"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://lora.algokit.io/${networkName.toLowerCase()}/account/${activeAddress}/`}
        >
          {ellipseAddress(activeAddress)}
        </a>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <label className="account-label">Network Status</label>
        <div className="flex items-center gap-2">
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          <span className="text-sm font-semibold">{networkName}</span>
        </div>
      </div>
    </div>
  )
}

export default Account
