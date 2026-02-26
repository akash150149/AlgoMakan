import algosdk from "algosdk";
import { algodClient } from "../src/algorand";

// 🔐 Seller / Admin account (TESTNET mnemonic only)
const MNEMONIC =
  "grape car sheriff cloth devote frame phrase want fatigue trap cable double sustain palm cradle multiply try property bomb home copy crop rib above dress";

async function createAsset() {
  const account = algosdk.mnemonicToSecretKey(MNEMONIC);

  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    total: 1,           // NFT
    decimals: 0,
    assetName: "ApnaMakan NFT #1",
    unitName: "AMNFT",
    assetURL: "https://example.com/metadata.json",
    defaultFrozen: false,
    manager: account.addr,
    reserve: account.addr,
    freeze: undefined,
    clawback: undefined,
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn(account.sk);

  const { txid } = await algodClient
    .sendRawTransaction(signedTxn)
    .do();

 const result = await algosdk.waitForConfirmation(
  algodClient,
  txid,
  4
);

console.log("FULL CONFIRMATION RESPONSE:");
console.log(result);


const assetId = (result as any)["asset-index"];
console.log("ASSET ID:", assetId);

};

createAsset().catch(console.error);
