# Extended Token Support - 76 Tokens

## Overview
Comprehensive token support for marketplace payments with 76 ERC20 tokens across 10 categories.

## Token Categories

### 1. ETH Wrappers & Liquid Staking (3 tokens)
- **WETH** - Wrapped Ether (0xC02a...6Cc2)
- **rETH** - Rocket Pool ETH (0xae78...6393)
- **wstETH** - Wrapped Lido Staked ETH (0x7f39...2Ca0)

### 2. BTC Wrappers (2 tokens)
- **WBTC** - Wrapped Bitcoin (8 decimals) (0x2260...C599)
- **tBTC** - tBTC v2 (0x1808...3a88)

### 3. USD Stablecoins (7 tokens)
- **USDC** - USD Coin (6 decimals) (0xA0b8...eB48)
- **USDT** - Tether USD (6 decimals) (0xdAC1...1ec7)
- **DAI** - Dai Stablecoin (0x6B17...1d0F)
- **LUSD** - Liquity USD (0x5f98...8bA0)
- **FRAX** - Frax (0x853d...b99e)
- **GHO** - Gho Token (0x40D1...6C2f)
- **crvUSD** - Curve USD (0xf939...1b4E)

### 4. EUR Stablecoins (3 tokens)
- **EURC** - Euro Coin (6 decimals) (0x1aBa...C33c)
- **EURS** - STASIS EURS (2 decimals) (0xdB25...7ad8)
- **EURT** - Euro Tether (6 decimals) (0xC581...E491)

### 5. Other Fiat Stablecoins (2 tokens)
- **XSGD** - Singapore Dollar Token (0x70e8...cA96)
- **TRYB** - BiLira (0x2C53...D0EB)

### 6. DeFi Blue Chips (16 tokens)
- **UNI** - Uniswap (0x1f98...F984)
- **AAVE** - Aave Token (0x7Fc6...DaE9)
- **MKR** - Maker (0x9f8F...579A2)
- **COMP** - Compound (0xc00e...6888)
- **CRV** - Curve DAO (0xD533...cd52)
- **CVX** - Convex (0x4e3F...9D2B)
- **SNX** - Synthetix (0xC011...2a6F)
- **YFI** - yearn.finance (0x0bc5...d93e)
- **LDO** - Lido DAO (0x5A98...1B32)
- **1INCH** - 1inch Token (0x1111...0C302)
- **BAL** - Balancer (0xba10...4e3D)
- **SUSHI** - SushiToken (0x6B35...0fE2)
- **KNC** - Kyber Network (0xdeFA...7202)
- **ZRX** - 0x Protocol (0xE41d...F498)
- **GNO** - Gnosis Token (0x6810...86b96)
- **EURA** - Angle Protocol Euro (0x1a7e...Bce8)

### 7. Infrastructure & Oracles (13 tokens)
- **LINK** - ChainLink (0x5149...86CA)
- **GRT** - Graph Token (0xc944...a44a7)
- **BAT** - Basic Attention (0x0D87...87EF)
- **OCEAN** - Ocean Token (0x967d...9F48)
- **RENDER** - Render Token (0x6De0...eb24)
- **LPT** - Livepeer (0x58b6...B239)
- **GLM** - Golem Network (0x7DD9...6429)
- **QNT** - Quant (0x4a22...4675)
- **ANKR** - Ankr Network (0x8290...EDD4)
- **FET** - Fetch.ai (0xaea4...Ad85)
- **API3** - API3 (0x0b38...88a)
- **NMR** - Numeraire (0x1776...6671)
- **WLD** - Worldcoin (0x163f...8753)

### 8. NFT & Metaverse (12 tokens)
- **APE** - ApeCoin (0x4d22...4381)
- **SAND** - The Sandbox (0x3845...a5d0)
- **MANA** - Decentraland (0x0F5D...C942)
- **AXS** - Axie Infinity (0xBB0E...B28b)
- **ENJ** - Enjin Coin (0xF629...3B9c)
- **IMX** - Immutable X (0xF57e...79fF)
- **CHZ** - Chiliz (0x3506...b4AF)
- **BLUR** - Blur (0x5283...8b44)
- **LOOKS** - LooksRare (0xf4d2...421E)
- **RARE** - SuperRare (0xba5B...6350)
- **RARI** - Rarible (0xFca5...41CF)
- **ILV** - Illuvium (0x767F...ca0E)

### 9. L2 & Ecosystem Tokens (10 tokens)
- **POL** - Polygon Ecosystem (0x455e...C3F6)
- **ARB** - Arbitrum (0xB507...4ad1)
- **MNT** - Mantle (0x3c3a...f354)
- **STRK** - StarkNet (0xCa14...2766)
- **METIS** - Metis (0x9E32...d8e)
- **LRC** - Loopring (0xBBbb...AEafD)
- **ZRO** - LayerZero (0x6985...71cd)
- **AXL** - Axelar (6 decimals) (0x4677...5f3)
- **ZK** - zkSync (0x66A5...C0A5)
- **CELR** - Celer Network (0x4F92...C667)

### 10. Liquid Staking & RWA (7 tokens)
- **WBETH** - Wrapped Binance Staked ETH (0xa2E3...2e1)
- **LsETH** - Liquid Staked ETH (0x8c1B...6549)
- **osETH** - StakeWise OsETH (0xf1C9...0E38)
- **SUSDe** - Staked USDe (0x9D39...3497)
- **XAUt** - Tether Gold (6 decimals) (0x6874...2F38)
- **ONDO** - Ondo Finance (0xfAbA...9BE3)
- **ENA** - Ethena (0x57e1...6061)

## Usage

### Basic Token Selection
```typescript
import { ExtendedCurrencySelector } from '@/components/marketplace';

<ExtendedCurrencySelector
    value={selectedCurrency}
    onChange={setSelectedCurrency}
    showCategories={true} // Group by category
/>
```

### Filter by Category
```typescript
<ExtendedCurrencySelector
    value={selectedCurrency}
    onChange={setSelectedCurrency}
    showCategories={true}
    allowedCategories={['USD_STABLECOINS', 'EUR_STABLECOINS']}
/>
```

### Get Token Info
```typescript
import { 
    getExtendedTokenBySymbol, 
    getExtendedTokenByAddress,
    getTokensByCategory 
} from '@/config/tokens';

// By symbol
const wbtc = getExtendedTokenBySymbol('WBTC');
console.log(wbtc.decimals); // 8

// By address
const token = getExtendedTokenByAddress('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599');

// By category
const stablecoins = getTokensByCategory('USD_STABLECOINS');
console.log(stablecoins.length); // 7
```

## Network Support

### Mainnet (Chain ID: 1)
- ✅ All 76 tokens available
- ✅ Category grouping enabled
- ✅ Search functionality

### Sepolia (Chain ID: 11155111)
- ✅ Basic tokens (WETH, USDC, DAI)
- ✅ Mock tokens (MERC20, MWBTC, MEURS, MUSDT)
- ❌ Extended tokens not deployed

### Hardhat (Chain ID: 31337)
- ✅ Mock tokens for testing
- ❌ Extended tokens not deployed

## Features

### Search
- Search by symbol (e.g., "USDC")
- Search by name (e.g., "USD Coin")
- Search by address (e.g., "0xA0b8...")

### Category Grouping
Tokens are organized into logical categories for easy navigation:
- Stablecoins grouped by currency (USD, EUR, etc.)
- DeFi protocols
- NFT/Gaming tokens
- Layer 2 solutions

### Smart Detection
- Automatically shows extended tokens on Mainnet
- Falls back to basic tokens on other networks
- Mock tokens only on test networks

## Decimal Handling

Most tokens use **18 decimals**, but watch out for:
- **6 decimals**: USDC, USDT, EURC, EURT, XSGD, TRYB, AXL, XAUt
- **8 decimals**: WBTC
- **2 decimals**: EURS

The `useERC20` hook handles these automatically:
```typescript
const { approve, hasEnoughBalance } = useERC20({
    tokenAddress: selectedToken.address,
    spenderAddress: marketplaceAddress,
    amount: "100", // Auto-converts based on token decimals
    decimals: selectedToken.decimals
});
```

## Smart Contract Compatibility

All 76 tokens work with the marketplace smart contract because it accepts any ERC20 token via the `currency` parameter:

```solidity
function listNFT(
    address nftAddress,
    uint256 tokenId,
    uint256 price,
    address currency // Can be any ERC20 token
) external
```

## Adding More Tokens

To add new tokens, edit `src/config/tokens-extended.ts`:

```typescript
// Add to MAINNET_EXTENDED_TOKENS
NEWTOKEN: {
    address: "0x...",
    symbol: "NEWTOKEN",
    name: "New Token Name",
    decimals: 18,
    category: "DEFI_BLUECHIPS", // Choose appropriate category
    icon: "N" // Optional
}
```

## Performance

- **Search**: Instant filtering across 76+ tokens
- **Rendering**: Virtualized list for smooth scrolling
- **Category grouping**: Optimized with useMemo
- **Mobile friendly**: Touch-optimized dropdown

## Testing

Test with different token decimals:
```bash
# 18 decimals (most tokens)
List at: 1.5 WETH → 1500000000000000000

# 8 decimals (WBTC)
List at: 0.05 WBTC → 5000000

# 6 decimals (USDC)
List at: 1000 USDC → 1000000000

# 2 decimals (EURS)
List at: 500 EURS → 50000
```

## Migration from Basic Selector

Replace `CurrencySelector` with `ExtendedCurrencySelector`:

```typescript
// Before
import { CurrencySelector } from '@/components/marketplace';

// After
import { ExtendedCurrencySelector } from '@/components/marketplace';
```

Both components share the same API, so it's a drop-in replacement!
