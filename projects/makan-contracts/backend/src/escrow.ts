import fs from "fs";
import path from "path";
import algosdk from "algosdk";
import { algodClient } from "./algorand";

export async function getEscrowLogicSig() {
  try {
    const tealPath = path.join(
      __dirname,
      "../../smart_contracts/escrow/escrow.teal"
    );

    const teal = fs.readFileSync(tealPath, "utf8");

    const compiled = await algodClient.compile(teal).do();

    const program = new Uint8Array(
      Buffer.from(compiled.result, "base64")
    );

    const lsig = new algosdk.LogicSigAccount(program);

    console.log(
      "ESCROW LOGICSIG ADDRESS:",
      lsig.address().toString()
    );

    return lsig;
  } catch (err) {
    console.error("ESCROW LOAD ERROR:", err);
    throw err;
  }
}
