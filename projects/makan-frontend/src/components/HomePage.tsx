/*
  src/components/HomePage_and_components.tsx
  Fully refactored with premium design system and stateful contract integration.
*/

import React, { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ConnectWallet from "./ConnectWallet";
import algosdk from "algosdk";
import { algodClient } from "../utils/algod";
import { checkOptIn } from "../utils/optIn";
import { RealEstateAppClient } from "../contracts/RealEstateApp";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export type Property = {
  id: string;
  title: string;
  priceMicroAlgos: number;
  assetId: bigint;
  escrowAddress: string;
  appId?: bigint;
  image: string;
  description: string;
  isSold: boolean;
};

/* -------------------------------------------------------------------------- */
/* Initial Properties                                                         */
/* -------------------------------------------------------------------------- */
const initialProperties: Property[] = [
  {
    id: "nft-001",
    title: "Lakeview Apartment #12",
    assetId: 755121764n,
    priceMicroAlgos: 450_000,
    appId: 756218220n,
    escrowAddress: "2GCUXCPBUQJKZOHWYGQ6XJJGDVOSA7PPSRM5BMHHB3MYPM7VPWEY3WUW2Q",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    description: "Elegant 2BHK with sweeping lake views and modern amenities. Tokenized on Algorand.",
    isSold: false,
  },
  {
    id: "nft-002",
    title: "Azure Horizons Villa",
    assetId: 756222307n,
    priceMicroAlgos: 1_250_000,
    appId: 756222265n,
    escrowAddress: "XC5DXZD3NJEVWI4AX", // Derived for informative purpose
    image: "/assets/beachfront_villa.png",
    description: "A coastal masterpiece featuring an infinity pool and direct beach access. Ultimate luxury.",
    isSold: false,
  },
  {
    id: "nft-003",
    title: "Midnight Sky Penthouse",
    assetId: 756222317n,
    priceMicroAlgos: 2_500_000,
    appId: 756222269n,
    escrowAddress: "XFUZ2QVR3FJ4MNI4MD6DQPRXAL2N6WCSGQW5X",
    image: "/assets/penthouse_cityview.png",
    description: "Sky-high living with floor-to-ceiling glass and panoramic views of the futuristic city.",
    isSold: false,
  },
  {
    id: "nft-004",
    title: "Silver Pine Chalet",
    assetId: 756222318n,
    priceMicroAlgos: 950_000,
    appId: 756222282n,
    escrowAddress: "MSCFIIA2HUBN5Y53STXXTTJQIZH42T6AORMM",
    image: "/assets/mountain_retreat.png",
    description: "Cozy timber and glass chalet nestled in the alpine heights. A perfect winter escape.",
    isSold: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Navbar Component                                                           */
/* -------------------------------------------------------------------------- */
export const Navbar: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const { activeAddress } = useWallet();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/" className="brand-logo">
          Apna<span>Makan</span>
        </a>

        <div className="nav-actions">
          {activeAddress ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 hidden sm:inline">
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-blue-500 ring-offset-2">
                AL
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

/* -------------------------------------------------------------------------- */
/* PurchaseNFT Component                                                      */
/* -------------------------------------------------------------------------- */
export const PurchaseNFT: React.FC<{
  property: Property;
  onPurchased: (id: string) => void;
  disabled?: boolean;
}> = ({ property, onPurchased, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const { activeAddress, transactionSigner } = useWallet();

  const handleBuy = async () => {
    if (property.isSold || loading || disabled) return;
    if (!activeAddress) {
      alert("Please connect your wallet first");
      return;
    }

    const sender = activeAddress;
    const proceed = window.confirm(`Confirm purchase for ${property.priceMicroAlgos / 1e6} ALGO?`);
    if (!proceed) return;

    setLoading(true);

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const optedIn = await checkOptIn(sender, property.assetId);

      if (!optedIn && property.assetId !== 0n) {
        const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender,
          receiver: sender,
          assetIndex: Number(property.assetId),
          amount: 0,
          suggestedParams,
        });

        const signedOptInRaw = await transactionSigner([optInTxn], [0]);
        const signedOptIn = signedOptInRaw.filter((t): t is Uint8Array => t !== null);
        const optInResp = await algodClient.sendRawTransaction(signedOptIn).do();
        await algosdk.waitForConfirmation(algodClient, optInResp.txid, 4);
      }

      if (property.appId) {
        console.log(`🚀 Using stateful app flow (${property.appId})`);
        const algorand = AlgorandClient.fromClients({ algod: algodClient });
        algorand.account.setSigner(sender, transactionSigner);

        const appClient = new RealEstateAppClient({
          appId: BigInt(property.appId),
          algorand,
          defaultSender: sender,
        });

        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender,
          receiver: appClient.appAddress,
          amount: property.priceMicroAlgos,
          suggestedParams,
        });

        const result = await appClient.send.buy({
          args: { payment: paymentTxn }
        });

        console.log("✅ Purchase successful:", result.transaction.txID());
      } else {
        alert("This listing currently uses a legacy LogicSig flow which requires a local backend server to be running.");
        throw new Error("Legacy flow requires backend server");
      }

      onPurchased(property.id);
      alert("Congratulations! You now own this property on the Algorand TestNet.");
    } catch (err) {
      console.error("PURCHASE ERROR:", err);
      alert(`Transaction failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading || disabled || property.isSold}
      className={`btn ${property.isSold ? 'btn-outline' : 'btn-primary'} w-full sm:w-auto`}
    >
      {loading ? "Processing..." : property.isSold ? "Sold Out" : "Buy Property"}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* NFTCard Component                                                          */
/* -------------------------------------------------------------------------- */
export const NFTCard: React.FC<{
  property: Property;
  onPurchase: (id: string) => void;
  processingId?: string | null;
}> = ({ property, onPurchase, processingId = null }) => {
  return (
    <article className="nft-card">
      <div className="nft-image-wrapper">
        <img
          src={property.image}
          alt={property.title}
          className="nft-image"
        />
      </div>

      <div className="nft-info">
        <div className="flex justify-between items-start mb-2">
          <h2 className="nft-title">{property.title}</h2>
          <span className={`status-badge ${property.isSold ? 'status-sold' : 'status-available'}`}>
            {property.isSold ? 'Sold' : 'Available'}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{property.description}</p>

        <div className="mt-auto border-t pt-4 flex flex-wrap gap-4 justify-between items-center">
          <div className="price-value">
            {property.priceMicroAlgos / 1e6} <span className="text-xs uppercase text-gray-400">ALGO</span>
          </div>
          <PurchaseNFT
            property={property}
            onPurchased={onPurchase}
            disabled={processingId === property.id}
          />
        </div>
      </div>
    </article>
  );
};

/* -------------------------------------------------------------------------- */
/* HomePage Component                                                         */
/* -------------------------------------------------------------------------- */
export const HomePage: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [processingId] = useState<string | null>(null);

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal);

  const handleMarkPurchased = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSold: true } : p))
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar onConnect={toggleWalletModal} />

      <main className="main-container">
        <header className="section-header">
          <h1 className="section-title">Verified Property <span>Collectibles</span></h1>
          <p className="section-subtitle">
            Secure your real estate investments as digital assets on the world's most robust blockchain.
          </p>
        </header>

        <section className="property-grid">
          {properties.map((p) => (
            <NFTCard
              key={p.id}
              property={p}
              onPurchase={handleMarkPurchased}
              processingId={processingId}
            />
          ))}
        </section>

        <footer className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>© 2026 ApnaMakan Real Estate Marketplace • Powered by Algorand</p>
        </footer>
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  );
};

export default HomePage;
