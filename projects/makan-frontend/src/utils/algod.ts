// src/utils/algod.ts
import algosdk from "algosdk";

export const algodClient = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  ""
);
