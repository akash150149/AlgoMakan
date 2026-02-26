import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { signAssetTransfer } from "./signAsset";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/sign-asset", async (req, res) => {
  try {
    const { txnBase64 } = req.body;

    if (!txnBase64) {
      console.error("❌ txnBase64 missing in request");
      return res.status(400).json({
        error: "txnBase64 missing",
      });
    }

    console.log("📥 Received asset txn for escrow signing");

    const signedTxn = await signAssetTransfer(txnBase64);

    console.log("✅ Escrow signed asset transaction");

    res.json({ signedTxn });

  } catch (err) {
    console.error("🔥 ESCROW SIGNING ERROR:", err);

    res.status(500).json({
      error: String(err),
    });
  }
});

app.listen(4000, () => {
  console.log("🚀 Escrow signer running on port 4000");
});
