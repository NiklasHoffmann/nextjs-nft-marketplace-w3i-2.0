/**
 * Extended Token Configuration
 * Comprehensive list of supported ERC20 tokens for marketplace payments
 * 
 * Total: 76 tokens across 10 categories
 */

export interface ExtendedTokenConfig {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
    category: string;
    icon?: string;
    isMock?: boolean;
}

export type TokenCategory =
    | 'ETH_WRAPPERS'
    | 'BTC_WRAPPERS'
    | 'USD_STABLECOINS'
    | 'EUR_STABLECOINS'
    | 'FIAT_STABLECOINS'
    | 'DEFI_BLUECHIPS'
    | 'INFRASTRUCTURE'
    | 'NFT_METAVERSE'
    | 'L2_ECOSYSTEM'
    | 'LIQUID_STAKING'
    | 'TESTNET_TOKENS'
    | 'MOCK_TOKENS';

/**
 * Mainnet Extended Token List (76 tokens)
 */
export const MAINNET_EXTENDED_TOKENS: Record<string, ExtendedTokenConfig> = {
    // ========================================
    // ETH WRAPPERS & LIQUID STAKING (3 tokens)
    // ========================================
    WETH: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        category: "ETH_WRAPPERS",
        icon: "W"
    },
    rETH: {
        address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
        symbol: "rETH",
        name: "Rocket Pool ETH",
        decimals: 18,
        category: "ETH_WRAPPERS"
    },
    wstETH: {
        address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
        symbol: "wstETH",
        name: "Wrapped Lido Staked ETH",
        decimals: 18,
        category: "ETH_WRAPPERS"
    },

    // ========================================
    // BTC WRAPPERS (2 tokens)
    // ========================================
    WBTC: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        symbol: "WBTC",
        name: "Wrapped Bitcoin",
        decimals: 8,
        category: "BTC_WRAPPERS",
        icon: "₿"
    },
    tBTC: {
        address: "0x18084fbA666a33d37592fA2633fD49a74DD93a88",
        symbol: "tBTC",
        name: "tBTC v2",
        decimals: 18,
        category: "BTC_WRAPPERS"
    },

    // ========================================
    // USD STABLECOINS (7 tokens)
    // ========================================
    USDC: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        category: "USD_STABLECOINS",
        icon: "$"
    },
    USDT: {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        category: "USD_STABLECOINS",
        icon: "₮"
    },
    DAI: {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        symbol: "DAI",
        name: "Dai Stablecoin",
        decimals: 18,
        category: "USD_STABLECOINS",
        icon: "D"
    },
    LUSD: {
        address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        symbol: "LUSD",
        name: "Liquity USD",
        decimals: 18,
        category: "USD_STABLECOINS"
    },
    FRAX: {
        address: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
        symbol: "FRAX",
        name: "Frax",
        decimals: 18,
        category: "USD_STABLECOINS"
    },
    GHO: {
        address: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
        symbol: "GHO",
        name: "Gho Token",
        decimals: 18,
        category: "USD_STABLECOINS"
    },
    crvUSD: {
        address: "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E",
        symbol: "crvUSD",
        name: "Curve USD",
        decimals: 18,
        category: "USD_STABLECOINS"
    },

    // ========================================
    // EUR STABLECOINS (3 tokens)
    // ========================================
    EURC: {
        address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        symbol: "EURC",
        name: "Euro Coin",
        decimals: 6,
        category: "EUR_STABLECOINS",
        icon: "€"
    },
    EURS: {
        address: "0xdB25f211AB05b1c97D595516F45794528a807ad8",
        symbol: "EURS",
        name: "STASIS EURS",
        decimals: 2,
        category: "EUR_STABLECOINS",
        icon: "€"
    },
    EURT: {
        address: "0xC581b735A1688071A1746c968e0798D642EDE491",
        symbol: "EURT",
        name: "Euro Tether",
        decimals: 6,
        category: "EUR_STABLECOINS",
        icon: "€"
    },

    // ========================================
    // OTHER FIAT STABLECOINS (2 tokens)
    // ========================================
    XSGD: {
        address: "0x70e8dE73cE538DA2bEEd35d14187F6959a8ecA96",
        symbol: "XSGD",
        name: "Singapore Dollar Token",
        decimals: 6,
        category: "FIAT_STABLECOINS"
    },
    TRYB: {
        address: "0x2C537E5624e4af88A7ae4060C022609376C8D0EB",
        symbol: "TRYB",
        name: "BiLira",
        decimals: 6,
        category: "FIAT_STABLECOINS"
    },

    // ========================================
    // DEFI BLUE CHIPS (16 tokens)
    // ========================================
    UNI: {
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        symbol: "UNI",
        name: "Uniswap",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    AAVE: {
        address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        symbol: "AAVE",
        name: "Aave Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    MKR: {
        address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
        symbol: "MKR",
        name: "Maker",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    COMP: {
        address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        symbol: "COMP",
        name: "Compound",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    CRV: {
        address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
        symbol: "CRV",
        name: "Curve DAO Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    CVX: {
        address: "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
        symbol: "CVX",
        name: "Convex Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    SNX: {
        address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
        symbol: "SNX",
        name: "Synthetix Network Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    YFI: {
        address: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
        symbol: "YFI",
        name: "yearn.finance",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    LDO: {
        address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
        symbol: "LDO",
        name: "Lido DAO Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    "1INCH": {
        address: "0x111111111117dC0aa78b770fA6A738034120C302",
        symbol: "1INCH",
        name: "1inch Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    BAL: {
        address: "0xba100000625a3754423978a60c9317c58a424e3D",
        symbol: "BAL",
        name: "Balancer",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    SUSHI: {
        address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
        symbol: "SUSHI",
        name: "SushiToken",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    KNC: {
        address: "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202",
        symbol: "KNC",
        name: "Kyber Network Crystal",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    ZRX: {
        address: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
        symbol: "ZRX",
        name: "0x Protocol Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    GNO: {
        address: "0x6810e776880C02933D47DB1b9fc05908e5386b96",
        symbol: "GNO",
        name: "Gnosis Token",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },
    EURA: {
        address: "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
        symbol: "EURA",
        name: "Angle Protocol Euro",
        decimals: 18,
        category: "DEFI_BLUECHIPS"
    },

    // ========================================
    // INFRASTRUCTURE & ORACLES (13 tokens)
    // ========================================
    LINK: {
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        symbol: "LINK",
        name: "ChainLink Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    GRT: {
        address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
        symbol: "GRT",
        name: "Graph Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    BAT: {
        address: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
        symbol: "BAT",
        name: "Basic Attention Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    OCEAN: {
        address: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        symbol: "OCEAN",
        name: "Ocean Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    RENDER: {
        address: "0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24",
        symbol: "RENDER",
        name: "Render Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    LPT: {
        address: "0x58b6A8A3302369DAEc383334672404Ee733aB239",
        symbol: "LPT",
        name: "Livepeer Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    GLM: {
        address: "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429",
        symbol: "GLM",
        name: "Golem Network Token",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    QNT: {
        address: "0x4a220E6096B25EADb88358cb44068A3248254675",
        symbol: "QNT",
        name: "Quant",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    ANKR: {
        address: "0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4",
        symbol: "ANKR",
        name: "Ankr Network",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    FET: {
        address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
        symbol: "FET",
        name: "Fetch.ai",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    API3: {
        address: "0x0b38210ea11411557c13457D4dA7dC6ea731B88a",
        symbol: "API3",
        name: "API3",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    NMR: {
        address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
        symbol: "NMR",
        name: "Numeraire",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },
    WLD: {
        address: "0x163f8C2467924be0ae7B5347228CABF260318753",
        symbol: "WLD",
        name: "Worldcoin",
        decimals: 18,
        category: "INFRASTRUCTURE"
    },

    // ========================================
    // NFT & METAVERSE (12 tokens)
    // ========================================
    APE: {
        address: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
        symbol: "APE",
        name: "ApeCoin",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    SAND: {
        address: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
        symbol: "SAND",
        name: "The Sandbox",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    MANA: {
        address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
        symbol: "MANA",
        name: "Decentraland",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    AXS: {
        address: "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b",
        symbol: "AXS",
        name: "Axie Infinity Shard",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    ENJ: {
        address: "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c",
        symbol: "ENJ",
        name: "Enjin Coin",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    IMX: {
        address: "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF",
        symbol: "IMX",
        name: "Immutable X",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    CHZ: {
        address: "0x3506424F91fD33084466F402d5D97f05F8e3b4AF",
        symbol: "CHZ",
        name: "Chiliz",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    BLUR: {
        address: "0x5283D291DBCF85356A21bA090E6db59121208b44",
        symbol: "BLUR",
        name: "Blur",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    LOOKS: {
        address: "0xf4d2888d29D722226FafA5d9B24F9164c092421E",
        symbol: "LOOKS",
        name: "LooksRare Token",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    RARE: {
        address: "0xba5BDe662c17e2aDFF1075610382B9B691296350",
        symbol: "RARE",
        name: "SuperRare",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    RARI: {
        address: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
        symbol: "RARI",
        name: "Rarible",
        decimals: 18,
        category: "NFT_METAVERSE"
    },
    ILV: {
        address: "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E",
        symbol: "ILV",
        name: "Illuvium",
        decimals: 18,
        category: "NFT_METAVERSE"
    },

    // ========================================
    // L2 & ECOSYSTEM TOKENS (10 tokens)
    // ========================================
    POL: {
        address: "0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6",
        symbol: "POL",
        name: "Polygon Ecosystem Token",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    ARB: {
        address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
        symbol: "ARB",
        name: "Arbitrum",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    MNT: {
        address: "0x3c3a81e81dc49A522A592e7622A7E711c06bf354",
        symbol: "MNT",
        name: "Mantle",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    STRK: {
        address: "0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766",
        symbol: "STRK",
        name: "StarkNet Token",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    METIS: {
        address: "0x9E32b13ce7f2E80A01932B42553652E053D6ed8e",
        symbol: "METIS",
        name: "Metis Token",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    LRC: {
        address: "0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD",
        symbol: "LRC",
        name: "Loopring",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    ZRO: {
        address: "0x6985884C4392D348587B19cb9eAAf157F13271cd",
        symbol: "ZRO",
        name: "LayerZero",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    AXL: {
        address: "0x467719aD09025FcC6cF6F8311755809d45a5E5f3",
        symbol: "AXL",
        name: "Axelar",
        decimals: 6,
        category: "L2_ECOSYSTEM"
    },
    ZK: {
        address: "0x66A5cFB2e9c529f14FE6364Ad1075dF3a649C0A5",
        symbol: "ZK",
        name: "zkSync Token",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },
    CELR: {
        address: "0x4F9254C83EB525f9FCf346490bbb3ed28a81C667",
        symbol: "CELR",
        name: "Celer Network",
        decimals: 18,
        category: "L2_ECOSYSTEM"
    },

    // ========================================
    // LIQUID STAKING & ADDITIONAL DEFI (7 tokens)
    // ========================================
    WBETH: {
        address: "0xa2E3356610840701BDf5611a53974510Ae27E2e1",
        symbol: "WBETH",
        name: "Wrapped Binance Staked ETH",
        decimals: 18,
        category: "LIQUID_STAKING"
    },
    LsETH: {
        address: "0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549",
        symbol: "LsETH",
        name: "Liquid Staked ETH",
        decimals: 18,
        category: "LIQUID_STAKING"
    },
    osETH: {
        address: "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38",
        symbol: "osETH",
        name: "StakeWise OsETH",
        decimals: 18,
        category: "LIQUID_STAKING"
    },
    SUSDe: {
        address: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
        symbol: "SUSDe",
        name: "Staked USDe",
        decimals: 18,
        category: "LIQUID_STAKING"
    },
    XAUt: {
        address: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
        symbol: "XAUt",
        name: "Tether Gold",
        decimals: 6,
        category: "LIQUID_STAKING"
    },
    ONDO: {
        address: "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3",
        symbol: "ONDO",
        name: "Ondo Finance",
        decimals: 18,
        category: "LIQUID_STAKING"
    },
    ENA: {
        address: "0x57e114B691Db790C35207b2e685D4A43181e6061",
        symbol: "ENA",
        name: "Ethena",
        decimals: 18,
        category: "LIQUID_STAKING"
    }
};

/**
 * Get tokens by category
 */
export function getTokensByCategory(category: TokenCategory): ExtendedTokenConfig[] {
    return Object.values(MAINNET_EXTENDED_TOKENS).filter(token => token.category === category);
}

/**
 * Get all extended tokens as array
 */
export function getAllExtendedTokens(): ExtendedTokenConfig[] {
    return Object.values(MAINNET_EXTENDED_TOKENS);
}

/**
 * Get token by symbol
 */
export function getExtendedTokenBySymbol(symbol: string): ExtendedTokenConfig | undefined {
    return MAINNET_EXTENDED_TOKENS[symbol];
}

/**
 * Get token by address
 */
export function getExtendedTokenByAddress(address: string): ExtendedTokenConfig | undefined {
    const addressLower = address.toLowerCase();
    return Object.values(MAINNET_EXTENDED_TOKENS).find(
        token => token.address.toLowerCase() === addressLower
    );
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<TokenCategory, string> = {
    ETH_WRAPPERS: "ETH Wrappers & Liquid Staking",
    BTC_WRAPPERS: "BTC Wrappers",
    USD_STABLECOINS: "USD Stablecoins",
    EUR_STABLECOINS: "EUR Stablecoins",
    FIAT_STABLECOINS: "Other Fiat Stablecoins",
    DEFI_BLUECHIPS: "DeFi Blue Chips",
    INFRASTRUCTURE: "Infrastructure & Oracles",
    NFT_METAVERSE: "NFT & Metaverse",
    L2_ECOSYSTEM: "L2 & Ecosystem",
    LIQUID_STAKING: "Liquid Staking & RWA",
    TESTNET_TOKENS: "Testnet Tokens",
    MOCK_TOKENS: "Mock Tokens (Testing)"
};
