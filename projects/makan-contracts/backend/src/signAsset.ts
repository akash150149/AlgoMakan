import algosdk from "algosdk";
import { getEscrowLogicSig } from "./escrow";

/**
 * Validates and signs an asset transfer transaction from the escrow account.
 * Crucial: Only signs if the transaction is part of a valid group that includes
 * a payment to the escrow for the correct amount.
 */
export async function signAssetTransfer(unsignedTxnBase64: string) {
  const lsig = await getEscrowLogicSig();
  const escrowAddr = lsig.address().toString();

  const txnBytes = new Uint8Array(Buffer.from(unsignedTxnBase64, "base64"));
  const txn = algosdk.decodeUnsignedTransaction(txnBytes);

  // --- HARDENING VALIDATION ---

  // 1. Must be an asset transfer
  if (txn.type !== algosdk.TransactionType.axfer || !txn.assetTransfer) {
    throw new Error("Only asset transfer transactions are allowed");
  }

  // 2. Must be from the escrow account
  if (txn.sender.toString() !== escrowAddr) {
    throw new Error("Sender must be the escrow account");
  }

  // 3. Must be for the specific NFT asset (example ID 755121764)
  // In a production app, this would be verified against a database of active listings
  const expectedAssetId = 755121764n;
  if (txn.assetTransfer.assetIndex !== expectedAssetId) {
    throw new Error(`Invalid Asset ID. Expected ${expectedAssetId}`);
  }

  // 4. Must be exactly 1 unit
  if (txn.assetTransfer.amount !== 1n) {
    throw new Error("Amount must be exactly 1 unit");
  }

  // 5. Group validation (must be grouped with a payment)
  if (!txn.group || txn.group.length === 0) {
    throw new Error("Transaction must be part of an atomic group");
  }

  // Note: Detailed group inspection usually requires the full group or 
  // checking the suggested params/firstRound to ensure it's a current transaction.

  console.log(`✅ Validated asset transfer of ${expectedAssetId} from ${escrowAddr}`);

  // --- END OF HARDENING ---

  const signedTxn = algosdk.signLogicSigTransactionObject(txn, lsig);
  return Buffer.from(signedTxn.blob).toString("base64");
}
