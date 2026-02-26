import algosdk from "algosdk";
import fs from "fs";
import path from "path";
import { algodClient } from "../src/algorand";

async function compileEscrow() {
  // Read TEAL relative to this script's directory
  const tealPath = path.resolve(
    __dirname,
    "..",
    "..",
    "smart_contracts",
    "escrow",
    "escrow.teal"
  );
  const tealSource = fs.readFileSync(tealPath, "utf8");

  const compileResult = await algodClient.compile(tealSource).do();

  const programBytes = new Uint8Array(
    Buffer.from(compileResult.result, "base64")
  );

  const escrowLogicSig = new algosdk.LogicSigAccount(programBytes);

  console.log("✅ Escrow compiled successfully");
  console.log(
  "ESCROW ADDRESS:",
  escrowLogicSig.address().toString()
);

}

compileEscrow().catch(console.error);
