/*
  src/components/HomePage_and_components.tsx

  Single-file bundle containing three components you requested:
   - HomePage (default page that lists NFTs)
   - NFTCard (reusable card for a property)
   - PurchaseNFT (handles the purchase logic)

  NOTE: You can split these into separate files if you prefer.
  This uses TypeScript + React + Tailwind CSS + use-wallet-react for Algorand.
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
/* Property Type                                                              */
/* -------------------------------------------------------------------------- */
export type Property = {
  id: string;
  title: string;
  priceMicroAlgos: number;
  assetId: bigint;
  escrowAddress: string;
  appId?: bigint; // Optional appId for stateful flow
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
    appId: 756218220n, // New Stateful App ID
    escrowAddress: "2GCUXCPBUQJKZOHWYGQ6XJJGDVOSA7PPSRM5BMHHB3MYPM7VPWEY3WUW2Q",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    description:
      "2BHK apartment with a beautiful lake view. Tokenized as NFT #001.",
    isSold: false,
  },
];

/* -------------------------------------------------------------------------- */
/* PurchaseNFT: Handles the purchase simulation                               */
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

    if (
      !property.assetId ||
      !property.escrowAddress ||
      !property.priceMicroAlgos
    ) {
      alert("Invalid NFT configuration");
      return;
    }

    const proceed = window.confirm(
      `Purchase ${property.title} for ${property.priceMicroAlgos / 1e6} ALGO?`
    );
    if (!proceed) return;

    setLoading(true);

    try {
      // 1) Suggested params
      const suggestedParams = await algodClient.getTransactionParams().do();

      // 2) Buyer opt-in
      const optedIn = await checkOptIn(sender, property.assetId);

      if (!optedIn) {
        const optInTxn =
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender,
            receiver: sender,
            assetIndex: property.assetId,
            amount: 0,
            suggestedParams,
          });

        const signedOptInRaw = await transactionSigner([optInTxn], [0]);
        const signedOptIn = signedOptInRaw.filter(
          (t): t is Uint8Array => t !== null
        );

        const optInResp = await algodClient
          .sendRawTransaction(signedOptIn)
          .do();

        await algosdk.waitForConfirmation(algodClient, optInResp.txid, 4);
      }

      // 3) Handle Purchase based on App or LogicSig
      if (property.appId) {
        console.log(`🚀 Using stateful app flow (${property.appId})`);

        const algorand = AlgorandClient.fromClients({ algod: algodClient });
        // Set the signer globally for this account in the AlgorandClient
        algorand.account.setSigner(sender, transactionSigner);

        const appClient = new RealEstateAppClient({
          appId: BigInt(property.appId), // Explicitly cast to BigInt to satisfy the client
          algorand,
          defaultSender: sender,
        });

        // The stateful contract's 'buy' method expects a payment transaction
        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender,
          receiver: appClient.appAddress,
          amount: property.priceMicroAlgos,
          suggestedParams,
        });

        // Pass the transaction directly; AlgorandClient will use the signer we set above
        const result = await appClient.send.buy({
          args: {
            payment: paymentTxn
          }
        });

        console.log("✅ Purchase successful via stateful contract:", result.transaction.txID());
      } else {
        // --- LEGACY LOGICSIG FLOW ---
        console.log("⚠️ Using legacy LogicSig flow (requires backend)");

        // 3) Payment txn (buyer → escrow)
        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender,
          receiver: property.escrowAddress,
          amount: property.priceMicroAlgos,
          suggestedParams,
        });

        // 4) Asset txn (escrow → buyer)
        const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: property.escrowAddress,
          receiver: sender,
          assetIndex: property.assetId,
          amount: 1,
          suggestedParams,
        });

        algosdk.assignGroupID([paymentTxn, assetTxn]);

        const res = await fetch("http://localhost:4000/sign-asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txnBase64: Buffer.from(assetTxn.toByte()).toString("base64"),
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Escrow signing failed: ${text}`);
        }

        const { signedTxn } = await res.json();
        const signedAssetTxn = Uint8Array.from(Buffer.from(signedTxn, "base64"));
        const [signedPaymentTxn] = await transactionSigner([paymentTxn], [0]);

        await algodClient.sendRawTransaction([signedPaymentTxn, signedAssetTxn]).do();
      }

      onPurchased(property.id);
      alert("NFT purchased successfully on TestNet");
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
      className="px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
    >
      {loading
        ? "Processing..."
        : property.isSold
          ? "Unavailable"
          : "Purchase"}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* NFTCard: Displays a single property card                                   */
/* -------------------------------------------------------------------------- */
export const NFTCard: React.FC<{
  property: Property;
  onPurchase: (id: string) => void;
  processingId?: string | null;
}> = ({ property, onPurchase, processingId = null }) => {
  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden border">
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium">{property.title}</h2>
            <p className="text-xs text-gray-500 mt-1">{property.id}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">
              {property.priceMicroAlgos / 1e6} ALGO
            </div>
            <div className="text-xs text-gray-400">Price</div>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600">{property.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            {property.isSold ? (
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-red-100 text-red-700">
                SOLD
              </span>
            ) : (
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                AVAILABLE
              </span>
            )}
          </div>

          <div>
            <PurchaseNFT
              property={property}
              onPurchased={onPurchase}
              disabled={processingId === property.id}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

/* -------------------------------------------------------------------------- */
/* HomePage: Lists all properties + shows wallet connect                      */
/* -------------------------------------------------------------------------- */
export const HomePage: React.FC = () => {
  const { activeAddress } = useWallet();
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal);

  const handleMarkPurchased = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSold: true } : p))
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">ApnaMakan — Properties</h1>
            <p className="text-sm text-gray-600 mt-1">
              TestNet NFT Marketplace. Using stateful contract for secure purchases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeAddress ? (
              <div className="text-sm px-3 py-1 border rounded">
                Connected: {activeAddress.slice(0, 8)}...
                {activeAddress.slice(-6)}
              </div>
            ) : (
              <button className="btn btn-primary" onClick={toggleWalletModal}>
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <NFTCard
              key={p.id}
              property={p}
              onPurchase={handleMarkPurchased}
              processingId={processingId}
            />
          ))}
        </section>

        <footer className="mt-8 text-xs text-gray-500">
          Note: This app uses stateful smart contracts on Algorand TestNet.
        </footer>
      </div>

      {/* Wallet modal */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </main>
  );
};

export default HomePage;
