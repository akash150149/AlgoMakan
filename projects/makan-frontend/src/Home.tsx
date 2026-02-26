// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import HomePage from './components/HomePage' // 👈 import your NFT listing page

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openDemoModal, setOpenDemoModal] = useState(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal)
  const toggleDemoModal = () => setOpenDemoModal(!openDemoModal)
  const toggleAppCallsModal = () => setAppCallsDemoModal(!appCallsDemoModal)

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-400 to-white">
      {/* === Hero Section === */}
      <section className="hero bg-teal-400 py-16 text-center">
        <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto shadow-lg">
          <h1 className="text-4xl">
            Welcome to <span className="font-bold">AlgoKit </span>
          </h1>
          <p className="py-6">
            This starter has been generated using the official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">
            <a
              data-test-id="getting-started"
              className="btn btn-primary m-2"
              target="_blank"
              href="https://github.com/algorandfoundation/algokit-cli"
              rel="noreferrer"
            >
              Getting started
            </a>

            <div className="divider" />

            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            {activeAddress && (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleDemoModal}>
                Transactions Demo
              </button>
            )}

            {activeAddress && (
              <button data-test-id="appcalls-demo" className="btn m-2" onClick={toggleAppCallsModal}>
                Contract Interactions Demo
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
        </div>
      </section>

      {/* === Real Estate NFTs Section === */}
      <section id="real-estate-nfts" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">🏠 Real Estate NFTs</h2>
          <HomePage /> {/* 👈 Embed your property listing page */}
        </div>
      </section>
    </div>
  )
}

export default Home
