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

async function test_createtoken(input: CreateTokenInput) {
    const name = 'test016';
    const symbol = 'TEST016';
    const image = 'XXXXXX';
    const decimals = 9;
    const website = 'XXXXXXX';
    const telegram = 'XXXXXX';
    const twitter = 'XXXXXXX';
    const description = 'XXXXXX';
    const initialMinting = 1000000;
    const delaySeconds = 1;    

    log("Creating token ...")
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
        initialMintingAmount: initialMinting
    }).catch(createTokenError => {
        log({
            createTokenError
        });
        return null
    })

    if (createTokenRes?.Err) {
        log(createTokenRes.Err)
        return
    }
    if (!createTokenRes || !createTokenRes.Ok) {
        log("failed to create tx")
        return
    }

    if (createTokenRes.Ok) {
        log("---- Token successfully minted ----")
        log("Tx Signature : ", createTokenRes.Ok.txSignature)
        log("Token Address : ", createTokenRes.Ok.tokenId)
    }

}

async function test_createmarket() {
    const orderSize = 0.01;
    const priceTick = 0.01;
    const base = '8yhiFekx469e1facJHMuDtNvPcmuoSqaKWbU1RS5B9fC';
    const quote = 'So11111111111111111111111111111111111111112';
    
    let baseMint: web3.PublicKey | undefined | null = undefined
    let quoteMint: web3.PublicKey | undefined | null = undefined
    // if (url != 'mainnet' && url != 'devnet') {
    //     log("please provide right url value ( 'mainnet' / 'devnet')")
    //     return
    // }
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
    if (!res) return log("failed to create pool")
    if (res.Err) return log({
        error: res.Err
    })
    if (!res.Ok) return log("failed to create pool")
    const {
        marketId,
        txSignature
    } = res.Ok
    log("Transaction Successfully Executed:")
    log("Transaction Signature: ", txSignature)
    log("Market Address: ", marketId)
}

async function test_createpool() {
    const baseAmount = 800000;
    const quoteAmount = 1;
    const market = 'FRSKNa9HoFUcEbrUYc5U98Nry4jcJW9StCLY15LnY3JN';

    let marketId: web3.PublicKey | undefined = undefined
    // if (url != 'mainnet' && url != 'devnet') {
    //     log("Provide right url value ( 'mainnet' / 'devnet')")
    //     return
    // }
    const id = getPubkeyFromStr(market)
    if (!id) {
        log("Invalid market id")
        return
    }
    marketId = id
    const res = await createPool({
        marketId,
        baseMintAmount: baseAmount,
        quoteMintAmount: quoteAmount,
        url
    }).catch(error => {
        console.log({
            createPoolError: error
        });
        return null
    });
    if (!res) return log("failed to create pool")
    if (res.Err) return log({
        error: res.Err
    })
    if (!res.Ok) return log("failed to create pool")
    const {
        poolId,
        txSignature
    } = res.Ok
    log("Pool creation transaction successfully:")
    log("transaction signature: ", txSignature)
    log("pool address: ", poolId)
}

async function test_buy() {
    const buyToken = 'base';
    const pool = '43FRXUYBJzbZ5cMXr7rjomLP53yYumtDAbzXmjRXbDoK';
    
    if (buyToken != 'base' && buyToken != 'quote') return log("buyToken args values should be 'base' or 'quote'")
    // const slippageAmount = Number(args.slipapge)
    const slippageAmount = 1;
    log({ slippageAmount })
    if (Number.isNaN(slippageAmount)) 
        return log("Please enter valid slippage amount")

    const slippage = getSlippage(slippageAmount)
    const poolId = getPubkeyFromStr(pool.trim())
    if (!poolId) 
        return log("Please enter valid pool address")
    const amount = 100000;
    if (Number.isNaN(amount))
        return log("Please enter valid amount")

    const txRes = await swap({
        amount,
        amountSide: 'receive',
        buyToken,
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
    log("--- Buy transaction successfull ---")
    log("Tx signature : ", txRes.Ok.txSignature)
}

async function test_sell() {
    const sellToken = 'base';
    const pool = '8oZvyFDicNHTgjEf99cANYbqkmktMB5jUHyxoSsxZjsE';
    if (sellToken != 'base' && sellToken != 'quote') 
        return log("buyToken args values should be 'base' or 'quote'")
    // const slippageAmount = Number(args.slipapge)
    
    const slippageAmount = 1;
    log({ slippageAmount })
    if (Number.isNaN(slippageAmount)) 
        return log("Please enter valid slippage amount")

    const slippage = getSlippage(slippageAmount)
    const poolId = getPubkeyFromStr(pool.trim())
    if (!poolId) 
        return log("Please enter valid pool address");

    const amount = 20000;
    if (Number.isNaN(amount)) return log("Please enter valid amount")
    const txRes = await swap({
        amount,
        amountSide: 'send',
        buyToken: 'base',
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

async function test_addliquidity() {
    const amount = 100000;
    const amountSide = 'base';
    if (amountSide != 'base' && amountSide != 'quote') {
        return log("invalid amount side value")
    }

    const pool = '8oZvyFDicNHTgjEf99cANYbqkmktMB5jUHyxoSsxZjsE';
    const poolId = getPubkeyFromStr(pool)
    if (!poolId) {
        log("Invalid pool id")
        return
    }

    const slippageAmount = 1; // %
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

async function test_removeliquidity() {
    const amount = 500;
    const pool = '8oZvyFDicNHTgjEf99cANYbqkmktMB5jUHyxoSsxZjsE';
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

async function test_unwrap() {
    unwrapSol(url);
}

async function test_minting() {
    log("token minting ...")

    const tokenAddress = 'HDfkYYe4gueim7vmNtNTqmzFSypmFQemrtr35FiP6Cif'; 

    const token = getPubkeyFromStr(tokenAddress)
    if (!token) 
        return log("Please enter valid token address")
    const amount = 1000000;
    await mintTo({
        token,
        amount,
        url
    })
}

async function test_revokeauth() {
    const tokenAddress = 'HDfkYYe4gueim7vmNtNTqmzFSypmFQemrtr35FiP6Cif'; 
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

async function test_createpool_buy() {
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

async function test_createpool_buy_remove() {
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


function main() {

    // STEP 1: token creation
    //test_createtoken(); 
    // ============> token address: HDfkYYe4gueim7vmNtNTqmzFSypmFQemrtr35FiP6Cif

    // STEP 2: create a market to create a pool
    //test_createmarket();
    // ============> market address: G6JcLPg1dBo2TgJ58bPG9AtwABDHgfD2jKfTPKbNMm3s

    // STEP 3: create pool and add liquidity
    //test_createpool();
    // ============> pool address; 8oZvyFDicNHTgjEf99cANYbqkmktMB5jUHyxoSsxZjsE

    // STEP 4: buy token from pool
    //test_buy();

    // STEP 5: sell token from pool
    //test_sell()

    // STEP 6: add liquidity in pool
    //test_addliquidity()

    // STEP 7: remove liquidity from the pool
    //test_removeliquidity()

    // STEP 8: unwrap wrapped sol to normal sol
    //test_unwrap()
    
    // STEP 8: token minting
    //test_minting()

    // STEP 9: revoke token authority
    //test_revokeauth()

    // STEP 10: create pool, bundle buy
    //test_createpool_buy()

    // STEP 11: create pool, add liq, bundle buy, wait and remove liq
    //test_createpool_buy_remove()

    console.log('XXXXXXXXXXXXXXXX')

}

main()