import { web3 } from "@project-serum/anchor";
import yargs, { command, option } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addLiquidity, createAndBuy, createMarket, createPool, createToken, mintTo, removeLiquidity, removeLiquidityFaster, revokeAuthority, swap, unwrapSol } from "./txHandler";
import { getPubkeyFromStr, getSlippage } from "./utils";
import { AddLiquidityInput, BundleRes, CreateAndBuy, CreateMarketInput, CreatePoolInput, CreateTokenInput, RemoveLiquidityInput, SwapInput } from "./types";

import { SPLAddLiquidityInput, SPLBundleRes, SPLCreateAndBuy, SPLCreateMarketInput, SPLCreatePoolInput, SPLCreateTokenInput, SPLRemoveLiquidityInput, SPLSwapInput } from "./spltypes";

const log = console.log;
const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms))

const url = 'devnet';

async function spl_createtoken(input: SPLCreateTokenInput) {
    const {name, symbol, image, decimals, website, telegram, twitter, description, initialMintingAmount} = input;
    const delaySeconds = 1;    

    log("\nCreating token ...")
    const createTokenRes = await createToken({
        name,
        symbol,
        url: url as any,
        image,
        decimals,
        website,
        twitter,
        telegram,
        description,
        initialMintingAmount: initialMintingAmount
    }).catch(createTokenError => {
        log({
            createTokenError
        });
        return null;
    })

    if (createTokenRes?.Err) {
        log(createTokenRes.Err)
        return null;
    }
    if (!createTokenRes || !createTokenRes.Ok) {
        log("failed to create tx")
        return null;
    }

    if (createTokenRes.Ok) {
        log("---- Token successfully minted ----")
        log("Tx Signature : ", createTokenRes.Ok.txSignature)
        log("Token Address : ", createTokenRes.Ok.tokenId)
    }

    return createTokenRes.Ok;
}

async function spl_createmarket(input: SPLCreateMarketInput) {
    log("\nCreating marketplace ...")
    const { orderSize, priceTick, base, quote} = input;
    
    let baseMint: web3.PublicKey | undefined | null = undefined
    let quoteMint: web3.PublicKey | undefined | null = undefined

    baseMint = getPubkeyFromStr(base)
    if (!baseMint) {
        log("Invalid base token address")
        return
    }
    quoteMint = getPubkeyFromStr(quote)
    if (!quoteMint) {
        log("Invalid quote token address")
        return
    }

    const res = await createMarket({
        baseMint,
        orderSize,
        priceTick,
        quoteMint,
        url
    }).catch(createMarketError => {
        log({
            createMarketError
        });
        return null
    })
    if (!res) {
        log("failed to create pool")
        return null;
    }

    if (res.Err) {
        log({error: res.Err})
        return null;
    }

    if (!res.Ok) {
        log("failed to create pool")
        return null;
    }
    
    const {
        marketId,
        txSignature
    } = res.Ok

    log("Transaction Successfully Executed:")
    log("Transaction Signature: ", txSignature)
    log("Market Address: ", marketId)

    return res.Ok;
}

async function spl_createpool(input: SPLCreatePoolInput) {
    log("\nCreating pool ...")
    const { baseMintAmount, quoteMintAmount, url } = input;

    const market = input.marketId;

    let marketId: web3.PublicKey | undefined = undefined

    const id = getPubkeyFromStr(market)
    if (!id) {
        log("Invalid market id")
        return
    }

    marketId = id
    const res = await createPool({
        marketId,
        baseMintAmount,
        quoteMintAmount,
        url
    }).catch(error => {
        console.log({
            createPoolError: error
        });
        return null
    });

    if (!res) {
        log("failed to create pool")
        return null;
    }

    if (res.Err) {
        log({ error: res.Err })
        return null;
    }

    if (!res.Ok) {
        log("failed to create pool");
        return null;
    } 

    const {
        poolId,
        txSignature
    } = res.Ok

    log("Pool creation transaction successfully:")
    log("transaction signature: ", txSignature)
    log("pool address: ", poolId)
    
    return res.Ok;
}

async function spl_buy(input: SPLSwapInput) {
    log("\nBuying ...")
    const { buyToken, url, amountSide } = input;
    const pool = input.poolId;
    
    if (buyToken != 'base' && buyToken != 'quote') return log("buyToken args values should be 'base' or 'quote'")
    // const slippageAmount = Number(args.slipapge)
    const slippageAmount = input.slippage;
    log({ slippageAmount })
    if (Number.isNaN(slippageAmount)) 
        return log("Please enter valid slippage amount")

    const slippage = getSlippage(slippageAmount)
    const poolId = getPubkeyFromStr(pool.trim())

    if (!poolId)
        return log("Please enter valid pool address")
        
    const amount = input.amount;
    if (Number.isNaN(amount))
        return log("Please enter valid amount");

    const txRes = await swap({
        amount,
        amountSide,
        buyToken,
        poolId,
        slippage,
        url
    }).catch(error => {
        return console.log({
            swapTxError: error
        });
    })

    if (!txRes)
        return log("transaction failed");
    

    if (txRes.Err)
        return log({ Error: txRes.Err })

    if (!txRes.Ok)
        return log("transaction failed");

    log("--- Buy transaction successfull ---")
    log("Tx signature : ", txRes.Ok.txSignature)
}


async function spl_sell(input: SPLSwapInput) {
    log("\nSelling token ...")
    const { sellToken, amount, amountSide, buyToken } = input;
    const pool = input.poolId;
    if (sellToken != 'base' && sellToken != 'quote') 
        return log("buyToken args values should be 'base' or 'quote'")
    // const slippageAmount = Number(args.slipapge)
    
    const slippageAmount = input.slippage;
    log({ slippageAmount })
    if (Number.isNaN(slippageAmount)) 
        return log("Please enter valid slippage amount")

    const slippage = getSlippage(slippageAmount)
    const poolId = getPubkeyFromStr(pool.trim())
    if (!poolId) 
        return log("Please enter valid pool address");

    if (Number.isNaN(amount)) return log("Please enter valid amount")
    const txRes = await swap({
        amount,
        amountSide,
        buyToken,
        sellToken,
        poolId,
        slippage,
        url
    }).catch(error => {
        console.log({
            swapTxError: error
        });
        return null
    })
    if (!txRes) return log("transaction failed")
    if (txRes.Err) return log({
        Error: txRes.Err
    })
    if (!txRes.Ok) return log("transaction failed")
    log("--- Sell transaction successfull ---")
    log("Tx signature : ", txRes.Ok.txSignature)
}


async function spl_addliquidity(input: SPLAddLiquidityInput) {
    log("\nAdd liquidity ...")
    const { amount, amountSide, url } = input;

    if (amountSide != 'base' && amountSide != 'quote') {
        return log("invalid amount side value")
    }

    const pool = input.poolId;
    const poolId = getPubkeyFromStr(pool)
    if (!poolId) {
        log("Invalid pool id")
        return
    }

    const slippageAmount = input.slippage; // %
    const slippage = getSlippage(slippageAmount)
    const res = await addLiquidity({
        amount,
        amountSide,
        poolId,
        slippage,
        url
    }).catch(outerAddLiquidityError => {
        log({
            outerAddLiquidityError
        })
        return null
    })

    if (!res) return log("failed to send the transaction")
    if (res.Err) return log({
        error: res.Err
    })
    if (!res.Ok) return log("failed to send the transaction")
    log(`Add liquidity transaction successfull\nTx Signature: ${res.Ok.txSignature}`)
}

async function spl_removeliquidity(input: SPLRemoveLiquidityInput) {
    log("\nRemove liquidity ...")
    const { amount, url } = input;

    const pool = input.poolId;
    const poolId = getPubkeyFromStr(pool)
    if (!poolId) {
        log("Invalid pool id")
        return
    }
    const res = await removeLiquidity({
        amount,
        poolId,
        url
    }).catch(outerRemoveLiquidityError => {
        log({
            outerRemoveLiquidityError
        })
        return null
    })
    if (!res) return log("failed to send the transaction")
    if (res.Err) return log({
        error: res.Err
    })
    if (!res.Ok) return log("failed to send the transaction")
    log(`Remove liquidity transaction successfull\nTx Signature: ${res.Ok.txSignature}`)
}

async function spl_unwrap() {
    unwrapSol(url);
}

async function spl_minting(amount: number, tokenAddress: string, url: any) {
    log("\ntoken minting ...")

    //const tokenAddress = 'HDfkYYe4gueim7vmNtNTqmzFSypmFQemrtr35FiP6Cif'; 
    const token = getPubkeyFromStr(tokenAddress)
    if (!token) 
        return log("Please enter valid token address")

    await mintTo({
        token,
        amount,
        url
    })
}

async function spl_createpool_buy() {
    const baseAmount = 500000;
    const quoteAmount = 1;
    const market = 'GAefctW9fPEjZvFzTXs8S8irnENRKKhhQqyRQVvr8wLm';
    const buyToken = 'base';
    const buyAmount = 300000;
    
    const marketId = getPubkeyFromStr(market)
    if (!marketId) {
        log("Invalid market id")
        return
    }

    if (buyToken != 'base' && buyToken != 'quote') {
        log("invalid buy token value (value should be `base` or `quote`")
        return
    }

    const res = await createAndBuy({
        marketId,
        baseMintAmount: baseAmount,
        quoteMintAmount: quoteAmount,
        buyToken,
        buyAmount,
        url
    }).catch((createAndBuyError) => {
        log({
            createAndBuyError
        })
        return null
    })

    if (!res) {
        log("Failed to send bundle")
        return
    }

    if (res.Err) {
        const err = res.Err
        console.log({
            err
        })
        if (typeof err == 'string') return log(err)
        const {
            bundleId,
            poolId
        } = err
        log("Unable to verify the bundle transaction")
        log("please check it")
        log("Bundle id: ", bundleId)
        log("poolId: ", poolId)
        log(`Check the bundle here: https://explorer.jito.wtf/bundle/${bundleId}`)
    }
    if (res.Ok) {
        const {
            bundleId,
            bundleStatus,
            buyTxSignature,
            createPoolTxSignature,
            poolId
        } = res.Ok
        log("Bundle send successfully")
        log("Bundle id: ", bundleId)
        log("Pool Id: ", poolId)
        log("Create pool transaction signature: ", createPoolTxSignature)
        log("Buy transaction signature: ", buyTxSignature)
        log(`Check the bundle here: ${process.env.JITO_BLOCK_ENGINE_URL}/bundle/${bundleId}`)
        return
    }
    return log("Failed to send bundle")
}

async function spl_createpool_buy_remove() {
    const baseAmount = 500000;
    const quoteAmount = 1;
    const market = 'G6JcLPg1dBo2TgJ58bPG9AtwABDHgfD2jKfTPKbNMm3s';
    const buyToken = 'base';
    const buyAmount = 100000;
    const delaySeconds = 0;

    const marketId = getPubkeyFromStr(market)
    if (!marketId) {
        log("Invalid market id")
        return
    }
    if (buyToken != 'base' && buyToken != 'quote') {
        log("invalid buy token value (value should be `base` or `quote`")
        return
    }
    const res = await createAndBuy({
        marketId,
        baseMintAmount: baseAmount,
        quoteMintAmount: quoteAmount,
        buyToken,
        buyAmount,
        url
    }).catch((createAndBuyError) => {
        log({
            createAndBuyError
        })
        return null
    })
    if (!res) {
        log("Failed to send bundle")
        return
    }
    let removePoolId = null;
    if (res.Err) {
        const err = res.Err
        console.log({ err })
        if (typeof err == 'string') return log(err)
        const { bundleId, poolId } = err
        removePoolId = poolId
        log("Unable to verify the bundle transaction")
        log("please check it")
        log("Bundle id: ", bundleId)
        log("poolId: ", poolId)
        log(`Check the bundle here: ${process.env.JITO_BLOCK_ENGINE_URL}/bundle/${bundleId}`)
    }
    if (res.Ok) {
        const {
            bundleId,
            bundleStatus,
            buyTxSignature,
            createPoolTxSignature,
            poolId
        } = res.Ok
        removePoolId = poolId
        log("Bundle send successfully")
        log("Bundle id: ", bundleId)
        log("Pool Id: ", poolId)
        log("Create pool transaction signature: ", createPoolTxSignature)
        log("Buy transaction signature: ", buyTxSignature)
        log(`Check the bundle here: https://explorer.jito.wtf/bundle/${bundleId}`)
    }

    await delay(delaySeconds * 1000)

    if (removePoolId != null) {
        const amount = -1
        const poolId = getPubkeyFromStr(removePoolId)
        if (!poolId) {
            log("Invalid pool id")
            return
        }
        const removeLiqRes = await removeLiquidity({
            amount,
            poolId,
            url
        }).catch(outerRemoveLiquidityError => {
            log({ outerRemoveLiquidityError })
            return null
        })
        if (!removeLiqRes) return log("failed to send the transaction")
        if (removeLiqRes.Err) return log({ error: removeLiqRes.Err })
        if (!removeLiqRes.Ok) return log("failed to send the transaction")
        log(`Remove liquidity transaction successfull\nTx Signature: ${removeLiqRes.Ok.txSignature}`)

        await unwrapSol(url)
        log(`Unwrapped sol`)
    }
}

async function spl_revokeauth(tokenAddress: string, url: any) {
    //const tokenAddress = 'HDfkYYe4gueim7vmNtNTqmzFSypmFQemrtr35FiP6Cif'; 
    const token = getPubkeyFromStr(tokenAddress)
    if (!token) {
        log("Invalid token address")
        return
    }

    await revokeAuthority({
        token,
        url
    })
}

async function spl_token_launchpad()
{
    // STEP 1: token creation
    const tokenInput: CreateTokenInput = {
        name: 'test000' ,
        symbol: 'test000',
        url: url as any,
        image: 'XXXXXXXXX',
        decimals: 6,
        website: 'XXXXXXXXX',
        twitter: 'XXXXXXXXX',
        telegram: 'XXXXXXXXX',
        description: 'XXXXXXXXX',
        initialMintingAmount: 1000000
    }

    const createTokenRes: any = await spl_createtoken(tokenInput);
    if (createTokenRes == null) {
        return;
    }

    // STEP 2: create a market to create a pool
    const base = createTokenRes.tokenId;
    const quote = 'So11111111111111111111111111111111111111112';

    let marketInput: SPLCreateMarketInput = {
        base,
        quote,
        orderSize: 0.1,
        priceTick: 0.1,
        url: url,
    }

    const createMarketRes: any = await spl_createmarket(marketInput);
    if (createMarketRes == null) {
        return;
    }

    // STEP 3: create pool
    const marketId = createMarketRes.marketId;
    const poolInput: SPLCreatePoolInput = {
        marketId,
        baseMintAmount: 800000,
        quoteMintAmount: 1,
        url
    }
    
    const createPoolRes: any = await spl_createpool(poolInput);
    if (createPoolRes == null)
        return;

    const poolId = createPoolRes.poolId;

    // STEP 4: buy token from pool
    const buyInput: SPLSwapInput = {
        amount: 100000,
        amountSide: 'receive',
        buyToken: 'base',
        poolId,
        slippage: 1, 
        url
    }

    await spl_buy(buyInput);

    // STEP 5: sell token from pool
    const sellInput: SPLSwapInput = {
        amount: 100000,
        amountSide: 'send',
        buyToken: 'base',
        sellToken: 'base',
        poolId,
        slippage: 1,
        url
    }

    await spl_sell(sellInput)

    // STEP 6: add liquidity in pool
    const addLiquidityInput: SPLAddLiquidityInput = {
        slippage: 1,
        poolId,
        amount: 100000,
        amountSide: 'base',
        url
    }

    await spl_addliquidity(addLiquidityInput)

    // STEP 7: remove liquidity from the pool
    const removeLiquidityInput: SPLRemoveLiquidityInput = {
        poolId,
        amount: 100000,
        url
    }
    
    await spl_removeliquidity(removeLiquidityInput)

    // STEP 8: unwrap wrapped sol to normal sol
    await spl_unwrap()
    
    // STEP 8: token minting
    await spl_minting(10000, base, url)

    // STEP 9: revoke token authority
    await spl_revokeauth(base, url)

    // STEP 10: create pool, bundle buy
    //test_createpool_buy()

    // STEP 11: create pool, add liq, bundle buy, wait and remove liq
    //test_createpool_buy_remove()

}


function main() {
    spl_token_launchpad()

}

main()