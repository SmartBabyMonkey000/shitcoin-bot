import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { SearcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import { isError } from "jito-ts/dist/sdk/block-engine/utils";
import { ClientReadableStream } from "@grpc/grpc-js";
import { buildSimpleTransaction } from "@raydium-io/raydium-sdk";

import {
  ENV,
  addLookupTableInfo,
  makeTxVersion,
} from "../constants";
import { BundleResult } from "jito-ts/dist/gen/block-engine/bundle";
import { getKeypairFromEnv } from "../utils";

const MEMO_PROGRAM_ID = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";

export async function build_bundle(
  search: SearcherClient,
  // accounts: PublicKey[],
  // regions: string[],
  bundleTransactionLimit: number,
  lp_ix : any,
  swap_ix : any,
  connection: Connection
) {
  const jito_auth_keypair = ENV.JITO_AUTH_KEYPAIR;
  const feeWallet = getKeypairFromEnv();

  const _tipAccount = (await search.getTipAccounts())[0];
  
  console.log("tip account:", _tipAccount);
  const tipAccount = new PublicKey(_tipAccount);

  let message1 = "First TXN";
  let message2 = "Second TXN";

  const bund = new Bundle([], bundleTransactionLimit);
  const resp = await connection.getLatestBlockhash("processed");

  bund.addTransactions(lp_ix);
  bund.addTransactions(swap_ix);

  let maybeBundle = bund.addTipTx(
    feeWallet,
    10000000,
    tipAccount,
    resp.blockhash
  );

  if (isError(maybeBundle)) {
    throw maybeBundle;
  }
  console.log();

  search.onBundleResult(
    (bundleResult: any) => {
      if (bundleResult.accepted) {
        console.log(
          `Bundle ${bundleResult.bundleId} accepted in slot ${bundleResult.accepted.slot}`
        );
      }

      if (bundleResult.rejected) {
        console.log(
          bundleResult.rejected,
          `Bundle ${bundleResult.bundleId} rejected:`
        );
      }
    },
    (error) => {
      console.log("Error with bundle:", error);
    }
  );

  try {
    const response_bund = await search.sendBundle(maybeBundle);
    console.log("response_bund:", response_bund);
  } catch (e) {
    console.error("error sending bundle:", e);
  }

  return maybeBundle;
}

export const onBundleResult = (c: SearcherClient): Promise<number> => {
  let first = 0;
  let isResolved = false;
  
  return new Promise((resolve) => {
    // Set a timeout to reject the promise if no bundle is accepted within 5 seconds
    setTimeout(() => {
      resolve(first);
      isResolved = true
    }, 30000);
    
    c.onBundleResult(
      
      (result) => {
        console.log('============> ZZZZZZZZZZZZZZZZ')
        if (isResolved) return first;
        // clearTimeout(timeout); // Clear the timeout if a bundle is accepted


        const bundleId = result.bundleId;
        const isAccepted = result.accepted;
        const isRejected = result.rejected;
        if (isResolved == false){

          if (isAccepted) {
            console.log(
              "bundle accepted, ID:",
              result.bundleId,
              " Slot: ",
              result.accepted?.slot
            );
            first +=1;
            isResolved = true;
            resolve(first); // Resolve with 'first' when a bundle is accepted
          }
  
          if (isRejected) {
            console.log("bundle is Rejected:", result);
            // Do not resolve or reject the promise here
          }

        }
       
      },
      (e) => {
        console.error(e);
        // Do not reject the promise here
      }
    );
  });
};




export const buildMemoTransaction = (
  keypair: Keypair,
  recentBlockhash: string,
  message: string
): VersionedTransaction => {
  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: keypair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(message),
  });

  const instructions = [ix];

  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: recentBlockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  tx.sign([keypair]);

  return tx;
};
