// src/utils/optIn.ts
import { algodClient } from "./algod";

export async function checkOptIn(
  address: string,
  assetId: bigint
): Promise<boolean> {
  const accountInfo = await algodClient
    .accountInformation(address)
    .do();

  const assetIdBigInt = BigInt(assetId);

  return (
    accountInfo.assets?.some(
      (asset) => asset.assetId === assetIdBigInt
    ) ?? false
  );
}
