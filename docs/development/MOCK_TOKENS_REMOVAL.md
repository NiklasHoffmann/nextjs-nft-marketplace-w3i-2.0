# Mock Tokens Removal Guide

## Overview
Mock tokens are integrated with clear separation markers for easy removal when deploying to production.

## Deployed Mock Tokens (Hardhat/Local)
- **MockERC20_18**: `0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e` (18 decimals) → Symbol: `MERC20`
- **MockUSDC_6**: `0xEaefa01B8c4c8126226A8B2DA2cF6Eb0E5B0bD26` (6 decimals) → Symbol: `USDC` (used as standard USDC)
- **MockWBTC_8**: `0xB1A8786Fd1bBDB7F56f8cEa78A77897a0Aa9fAb2` (8 decimals) → Symbol: `MWBTC`
- **MockEURS_2**: `0xe06E78AB6314993FCa9106536aecfE4284aA791a` (2 decimals) → Symbol: `MEURS`
- **MockUSDTLike_6**: `0xd11Db19892F8c9C89A03Ba6EFD636795cbBc0d74` (6 decimals) → Symbol: `MUSDT`

## Removal Steps

### 1. Remove from `src/config/tokens.ts`

**File: `src/config/tokens.ts`**

#### Step 1a: Update `NetworkTokens` Interface
Remove these lines (marked with `// Mock tokens (Hardhat only)`):
```typescript
// Mock tokens (Hardhat only)
MOCK_ERC20?: TokenConfig;
MOCK_WBTC?: TokenConfig;
MOCK_EURS?: TokenConfig;
MOCK_USDT?: TokenConfig;
```

#### Step 1b: Remove Mock Token Definitions
In the Hardhat configuration (`"31337"`), remove the entire section between:
```typescript
// ========================================
// MOCK TOKENS (Development/Testing Only)
// ========================================
```
and
```typescript
// ======================================== END MOCK TOKENS
```

This includes:
- `MOCK_ERC20` object
- `MOCK_WBTC` object
- `MOCK_EURS` object
- `MOCK_USDT` object

#### Step 1c: Update `getTokenConfig` Function
Change the type union from:
```typescript
tokenSymbol: 'WETH' | 'USDC' | 'DAI' | 'MOCK_ERC20' | 'MOCK_WBTC' | 'MOCK_EURS' | 'MOCK_USDT'
```
to:
```typescript
tokenSymbol: 'WETH' | 'USDC' | 'DAI'
```

#### Step 1d: Update `getAvailableTokens` Function
Remove the mock tokens section:
```typescript
// ======================================== MOCK TOKENS SECTION
// Add mock tokens only if requested (easy to remove this entire block)
if (shouldIncludeMocks) {
    if (networkTokens.MOCK_ERC20) tokens.push(networkTokens.MOCK_ERC20);
    if (networkTokens.MOCK_WBTC) tokens.push(networkTokens.MOCK_WBTC);
    if (networkTokens.MOCK_EURS) tokens.push(networkTokens.MOCK_EURS);
    if (networkTokens.MOCK_USDT) tokens.push(networkTokens.MOCK_USDT);
}
// ======================================== END MOCK TOKENS
```

And simplify the function to remove `includeMockTokens` parameter:
```typescript
export function getAvailableTokens(chainId: number | string): TokenConfig[] {
    const networkTokens = TOKENS[chainId.toString()];
    if (!networkTokens) return [];
    
    const tokens: TokenConfig[] = [];
    if (networkTokens.WETH) tokens.push(networkTokens.WETH);
    if (networkTokens.USDC) tokens.push(networkTokens.USDC);
    if (networkTokens.DAI) tokens.push(networkTokens.DAI);
    
    return tokens;
}
```

#### Step 1e: Update `getTokenSymbolByAddress` Function
Remove the mock tokens lookup section:
```typescript
// ======================================== MOCK TOKENS LOOKUP
// Check mock tokens (easy to remove this entire block)
if (networkTokens.MOCK_ERC20?.address.toLowerCase() === addressLower) return 'MERC20';
if (networkTokens.MOCK_WBTC?.address.toLowerCase() === addressLower) return 'MWBTC';
if (networkTokens.MOCK_EURS?.address.toLowerCase() === addressLower) return 'MEURS';
if (networkTokens.MOCK_USDT?.address.toLowerCase() === addressLower) return 'MUSDT';
// ======================================== END MOCK TOKENS
```

#### Step 1f: Remove `isMock` Flag (Optional)
If no longer needed, remove from `TokenConfig` interface:
```typescript
isMock?: boolean; // Flag for development/testing tokens
```

---

### 2. Update `src/components/marketplace/CurrencySelector.tsx`

**File: `src/components/marketplace/CurrencySelector.tsx`**

#### Step 2a: Simplify Icon Mapping in `CurrencySelector`
Replace the icon mapping switch statement with the original ternary:
```typescript
// Before (with mocks):
...availableTokens.map(token => {
    let icon = 'T';
    switch(token.symbol) {
        case 'WETH': icon = 'W'; break;
        case 'USDC': icon = '$'; break;
        case 'DAI': icon = 'D'; break;
        case 'MERC20': icon = 'M'; break;
        case 'MWBTC': icon = '₿'; break;
        case 'MEURS': icon = '€'; break;
        case 'MUSDT': icon = '₮'; break;
    }
    
    return {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        icon: icon,
        isMock: token.isMock
    };
})

// After (without mocks):
...availableTokens.map(token => ({
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    icon: token.symbol === 'WETH' ? 'W' : token.symbol === 'USDC' ? '$' : 'D'
}))
```

#### Step 2b: Simplify Colors in `CurrencyBadge`
Remove mock token colors:
```typescript
// Remove these lines:
// ======================================== MOCK TOKENS COLORS (easy to remove)
'MERC20': 'bg-orange-100 text-orange-700',
'MWBTC': 'bg-amber-100 text-amber-700',
'MEURS': 'bg-indigo-100 text-indigo-700',
'MUSDT': 'bg-teal-100 text-teal-700'
// ======================================== END MOCK TOKENS
```

Result:
```typescript
const colors: Record<string, string> = {
    'WETH': 'bg-purple-100 text-purple-700',
    'USDC': 'bg-green-100 text-green-700',
    'DAI': 'bg-yellow-100 text-yellow-700'
};
```

#### Step 2c: Simplify Icon Logic in `CurrencyBadge`
Replace switch statement with ternary:
```typescript
// Before:
let icon = 'T';
switch(symbol) {
    case 'WETH': icon = 'W'; break;
    case 'USDC': icon = '$'; break;
    case 'DAI': icon = 'D'; break;
    case 'MERC20': icon = 'M'; break;
    case 'MWBTC': icon = '₿'; break;
    case 'MEURS': icon = '€'; break;
    case 'MUSDT': icon = '₮'; break;
}

// After:
const icon = symbol === 'USDC' ? '$' : symbol === 'DAI' ? 'D' : 'W';
```

---

## Alternative: Disable Mock Tokens Without Removing Code

If you want to keep the code but disable mock tokens temporarily:

**Option 1: Use `includeMockTokens` parameter**
```typescript
// In any component using getAvailableTokens:
const availableTokens = getAvailableTokens(chainId, false); // false = no mocks
```

**Option 2: Environment Variable**
Add to `.env.local`:
```
NEXT_PUBLIC_ENABLE_MOCK_TOKENS=false
```

Then check in `getAvailableTokens`:
```typescript
const shouldIncludeMocks = includeMockTokens ?? 
    (chainId.toString() === '31337' && process.env.NEXT_PUBLIC_ENABLE_MOCK_TOKENS !== 'false');
```

---

## Verification After Removal

1. **Build Check**: Run `npm run build` to ensure no TypeScript errors
2. **Token List**: Verify only ETH, WETH, USDC, DAI appear in dropdown
3. **Badge Colors**: Confirm only blue (ETH), purple (WETH), green (USDC), yellow (DAI) colors are used
4. **Search Code**: Search for `MOCK_` in codebase to ensure nothing was missed

---

## Summary

All mock token code is clearly marked with:
- `// ======================================== MOCK TOKENS` comments
- `// ======================================== END MOCK TOKENS` comments

Simply remove everything between these markers to completely clean up mock token integration.
