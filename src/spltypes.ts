import { web3 } from "@project-serum/anchor"
import { Percent } from "@raydium-io/raydium-sdk"

export type SPLCreateTokenInput = {
    name: string,
    symbol?: string,
    image?: string
    website?: string
    twitter?: string
    telegram?: string
    description?: string
    decimals: number
    url: 'mainnet' | 'devnet'
    initialMintingAmount: number
    revokeAuthorities?: boolean
}

export type SPLCreateMarketInput = {
    base: string,
    quote: string,
    orderSize: number,
    priceTick: number,
    url: 'mainnet' | 'devnet',
}
export type SPLAddLiquidityInput = {
    slippage: number,
    poolId: string,
    amount: number,
    amountSide: 'base' | 'quote',
    url: 'mainnet' | 'devnet',
}
export type SPLRemoveLiquidityInput = {
    poolId: string,
    amount: number,
    url: 'mainnet' | 'devnet',
    unwrapSol?: boolean
}

export type SPLCreatePoolInput = {
    marketId: string,
    baseMintAmount: number,
    quoteMintAmount: number,
    url: 'mainnet' | 'devnet',
}

export type SPLSwapInput = {
    poolId: string,
    buyToken: "base" | 'quote',
    sellToken?: 'base' | 'quote',
    amountSide: "send" | 'receive',
    amount: number,
    slippage: number,
    url: 'mainnet' | 'devnet',
}

export type SPLCreateAndBuy = {
    //pool
    marketId: web3.PublicKey,
    baseMintAmount: number,
    quoteMintAmount: number,
    url: 'mainnet' | 'devnet',

    //buy
    buyToken: 'base' | 'quote',
    buyAmount: number
}

export type SPLBundleRes = {
    uuid: string;
    timestamp: string;
    validatorIdentity: string;
    transactions: string[];
    slot: number;
    status: number;
    landedTipLamports: number;
    signer: string;
    __typename: string;
}