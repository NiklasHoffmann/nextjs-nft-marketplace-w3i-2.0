# MultiSig Migration Plan - Step by Step

**Status:** ✅ Frontend vollständig implementiert  
**Aktuell:** Single-Owner Mode (Testbereit)  
**Ziel:** MultiSig-Owner Mode  
**Strategie:** Schrittweise Migration ohne Downtime

---

## 🎉 Implementation Update

### ✅ Phase 1 ABGESCHLOSSEN (Januar 2026)

**Frontend Integration - 100% Complete:**
- ✅ Komplettes Type System (11 Diamond Operations, 8 Transaction Types)
- ✅ Contract ABIs (MultiSig + Diamond)
- ✅ Service Layer mit Encoding, Validation, Formatting
- ✅ React Hooks (useMultisigWallet, usePendingTransactions, useAdminMode)
- ✅ UI Components (AdminModeIndicator, MigrationBanner, TransactionCard, TransactionBuilder)
- ✅ Admin Pages (/admin/multisig-wallet + /submit)
- ✅ Navigation Integration (AdminNavbar)
- ✅ Build Success (TypeScript clean)

**Was bedeutet das?**
→ Ihr könnt JETZT mit Testing anfangen!  
→ Kein weiterer Frontend-Code nötig!  
→ Dual-Mode System läuft parallel!

---

## 🎯 Übersicht

### Current State
- **Diamond Owner:** Single EOA Wallet (dein Account)
- **Admin Mode:** Direct execution, keine Confirmations
- **Risk:** Single point of failure

### Target State
- **Diamond Owner:** MultiSig Wallet (`0x2180...52C7` Sepolia / `0x66dc...407f` Mainnet)
- **Admin Mode:** Multi-signature mit 2/3 Consensus
- **Risk:** Distributed, sicherer

### Migration Strategy
✅ **Non-Breaking:** Du kannst weiter als Single-Owner arbeiten  
✅ **Parallel Development:** MultiSig Integration läuft parallel  
✅ **Tested Before Switch:** Alles auf Testnet testen  
✅ **Controlled Timing:** Du entscheidest WANN der Switch passiert

---

## 📋 ~~Phase 1: Vorbereitung~~ ✅ FERTIG

**Status:** ✅ 100% Complete (Januar 2026)

**Was wurde implementiert:**

### ✅ 1. Type System & Constants
- `src/types/multisig-wallet.ts` - Complete
- MULTISIG_ADDRESSES (Mainnet & Sepolia)
- TransactionType Enum (8 types)
- DiamondOperation Enum (11 operations)
- DIAMOND_OPERATION_TEMPLATES mit args
- AdminMode Enum (SINGLE_OWNER, MULTISIG, TRANSITIONING)

### ✅ 2. Contract ABIs
- `src/config/abis/multisig-wallet.ts` - Complete MultiSig ABI
- `src/config/abis/diamond.ts` - Diamond ownership & admin functions

### ✅ 3. Service Layer
- `src/services/multisig/MultisigService.ts` - Complete
- encodeDiamondOperation() - Encode contract calls
- createDiamondTransactionRequest() - Build TX requests
- decodeContractCall() - Decode for UI display
- calculateRequiredConfirmations() - Dynamic consensus
- enhancePendingTransaction() - Add metadata
- validateTransactionRequest() / validateOperationArgs()
- Formatting utilities (value, status, colors)

### ✅ 4. React Hooks
- `src/hooks/multisig/useMultisigWallet.ts` - wagmi v2 integration
  - submitTransaction(), confirmTransaction(), revokeConfirmation()
  - Read functions: transactionCount, owners, isOwner
  - Loading states: isSubmitting, isConfirming, isRevoking
  
- `src/hooks/multisig/usePendingTransactions.ts` - Fetch & enhance
  - Loops through all transactions
  - Gets confirmations per owner
  - Adds permissions (canConfirm, canRevoke, canExecute)
  
- `src/hooks/useAdminMode.ts` - Mode detection
  - Reads Diamond owner & pendingOwner
  - Compares with MultiSig address
  - Returns AdminModeInfo

### ✅ 5. UI Components
- `src/components/admin/AdminModeIndicator.tsx` - Mode badge
  - Green: MultiSig Active (2/3 confirmations)
  - Blue: Single-Owner Mode (direct execution)
  - Yellow: Transitioning (ownership pending)

- `src/components/admin/MigrationBanner.tsx` - Migration notice
  - Shows countdown to migration
  - Lists requirements
  - Dismissible
  - Links to docs & MultiSig interface

- `src/components/admin/multisig/MultiSigTransactionCard.tsx` - TX display
  - Transaction details with type badge
  - Confirmation progress bar
  - Confirmed owners list
  - Confirm/Revoke action buttons
  - Status labels (Ready, Waiting, Inactive)

- `src/components/admin/multisig/TransactionBuilder.tsx` - Submit form
  - Operation dropdown (11 Diamond operations)
  - Dynamic argument inputs
  - Validation before submit
  - Success/error messaging
  - Info box explaining process

### ✅ 6. Admin Pages
- `/admin/multisig-wallet` (`src/app/admin/multisig-wallet/page.tsx`)
  - Filter tabs: All / Ready to Execute / Pending
  - Grid of transaction cards
  - Submit Transaction button
  - Empty states with helpful CTAs
  - Info box explaining workflow

- `/admin/multisig-wallet/submit` (`src/app/admin/multisig-wallet/submit/page.tsx`)
  - TransactionBuilder component
  - Back navigation
  - Help text with important notes
  - Warnings about gas & execution

### ✅ 7. Navigation & Integration
- AdminNavbar updated with "MultiSig Wallet (On-Chain)" menu item
- "Ready" badge support
- Direct Marketplace Admin page: AdminModeIndicator + MigrationBanner
- Admin Dashboard: MultiSig Wallet card

### ✅ 8. Build & Quality
- TypeScript compilation clean (no errors)
- All imports fixed (inline SVGs, no @heroicons dependency)
- LoadingState component integration
- wagmi v2 patterns throughout
- Proper error handling
- Loading states in all components

**Zeit investiert:** ~5-6 Stunden  
**Resultat:** Production-ready Frontend! ✅

---

## 📋 Phase 2: Testing (AKTUELL - 1-2 Tage)

**Ziel:** MultiSig System auf Sepolia testen

### 2.1 Environment Setup

**Datei:** `.env.local`
```bash
# Sepolia Testing
NEXT_PUBLIC_DIAMOND_ADDRESS=0x...              # Your Sepolia Diamond Address
NEXT_PUBLIC_CHAIN_ID=11155111                  # Sepolia
NEXT_PUBLIC_MULTISIG_ADDRESS=0x2180aFbC0156E6fF3156ca57C4dFb0a1AB9152C7  # Optional
```

### 2.2 Start Development Server

```bash
npm run dev
# Server läuft auf http://localhost:3000
```

**Navigate to:**
- Main Dashboard: http://localhost:3000/admin
- MultiSig Wallet: http://localhost:3000/admin/multisig-wallet
- Submit Transaction: http://localhost:3000/admin/multisig-wallet/submit

### 2.3 Diamond Ownership Transfer

**Step 1: Initiate Transfer (als aktueller Owner)**
                All operations require 2/3 owner confirmations
              </p>
            </div>
          </>
        ) : (
          <>
            <UserIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Single-Owner Mode</h3>
              <p className="text-sm text-blue-700">
                Direct execution - MultiSig migration pending
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### 1.3 Migration Banner

**Upcoming Migration Notice:**
```typescript
// src/components/admin/MigrationBanner.tsx

export function MigrationBanner() {
  const migrationDate = new Date('2026-02-15'); // Beispiel
  const daysUntil = Math.ceil((migrationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            MultiSig Migration Scheduled
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              In <strong>{daysUntil} days</strong> ({migrationDate.toLocaleDateString()}), 
              this marketplace will migrate to MultiSig governance.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All admin operations will require 2/3 owner confirmations</li>
              <li>3 co-owners: Stefan, Wolfi, Niklas</li>
              <li>Direct admin access will be disabled</li>
            </ul>
            <a href="/admin/multisig-wallet" className="font-medium underline hover:text-yellow-600 mt-2 inline-block">
              Preview MultiSig Interface →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Phase 2: Testing (1 Woche)

**Ziel:** MultiSig System auf Testnet durchspielen

### 2.1 Test-Szenario Setup

**Voraussetzungen:**
- ✅ 3 Test Wallets (Owner 1, 2, 3)
- ✅ Sepolia MultiSig deployed (`0x2180...52C7`)
- ✅ Test Diamond Contract auf Sepolia
- ✅ Frontend zeigt MultiSig UI

### 2.2 Test Cases

**Test 1: Ownership Transfer**
```bash
# Als current owner:
1. Call transferOwnership(MULTISIG_ADDRESS) ✅
2. Verify getPendingOwner() = MULTISIG_ADDRESS ✅

# Als MultiSig:
3. Owner 1: Submit acceptOwnership() transaction ✅
4. Owner 2: Confirm transaction → Auto-Execute ✅
5. Verify diamond.owner() = MULTISIG_ADDRESS ✅
```

**Test 2: Pause Contract (2/3 Consensus)**
```bash
1. Owner 1: Submit pause() via MultiSig ✅
2. Check: numConfirmations = 1 ✅
3. Owner 2: Confirm → Auto-Execute ✅
4. Verify: contract is paused ✅
5. Owner 3: Was NOT needed (2/3 sufficient) ✅
```

**Test 3: Set Innovation Fee**
```bash
1. Owner 2: Submit setInnovationFee(250) ✅
2. Owner 3: Confirm → Execute ✅
3. Verify: fee changed to 250 ✅
```

**Test 4: Revoke Confirmation**
```bash
1. Owner 1: Submit unpause() ✅
2. Owner 2: Confirm (1/2 confirmations) ⏳
3. Owner 2: Revoke confirmation ✅
4. Check: numConfirmations = 1 again ✅
5. Owner 3: Confirm instead → Execute ✅
```

**Test 5: Error Handling**
```bash
1. Try to execute with only 1 confirmation → Should fail ❌
2. Non-owner tries to confirm → Should fail ❌
3. Try to confirm twice → Should fail ❌
```

### 2.3 Performance Testing

**Measure Gas Costs:**
```typescript
// Test und dokumentiere:
- Submit transaction: ~100k gas
- Confirm transaction: ~50k gas
- Total per operation: ~150-200k gas
- Estimated cost @ 20 gwei: ~$1-3
```

---

## 📋 Phase 3: Migration Day (1 Stunde)

**Ziel:** Owner von Single → MultiSig wechseln

### 3.1 Pre-Migration Checklist

**24 Stunden vorher:**
- [ ] Alle 3 Co-Owners notifizieren
- [ ] Migration Banner im Frontend aktivieren
- [ ] Backup aller Admin Credentials
- [ ] Test auf Sepolia nochmal durchführen
- [ ] Downtime Window kommunizieren (falls nötig)

**1 Stunde vorher:**
- [ ] Alle Co-Owners online & bereit
- [ ] Wallets connected & funded (für Gas)
- [ ] Frontend auf Production deployed
- [ ] Monitoring aktiviert

### 3.2 Migration Execution

**Step 1: Transfer Ownership (2 Minuten)**
```typescript
// Current owner ruft auf Diamond Contract auf:
await diamond.transferOwnership(MULTISIG_ADDRESS);

// Verify:
const pendingOwner = await diamond.getPendingOwner();
console.log('Pending owner:', pendingOwner); // Should be MultiSig address
```

**Step 2: Accept via MultiSig (3 Minuten)**
```typescript
// Owner 1 (z.B. Stefan) submitted:
const acceptData = encodeFunctionData({
  abi: DIAMOND_ABI,
  functionName: 'acceptOwnership',
  args: []
});

const tx = await multiSig.submitTransaction(
  TransactionType.Other,  // 7
  DIAMOND_ADDRESS,
  0,
  acceptData
);

const receipt = await tx.wait();
const txIndex = getSubmittedTxIndex(receipt); // From event logs

// Owner 2 (z.B. Wolfi) confirms:
await multiSig.confirmTransaction(txIndex);

// Auto-Execute! ✅
```

**Step 3: Verify (1 Minute)**
```typescript
// Check Diamond Contract:
const newOwner = await diamond.owner();
console.log('New owner:', newOwner); // Should be MultiSig address

// Success! 🎉
```

### 3.3 Post-Migration Actions

**Sofort:**
```typescript
// 1. Direct Admin deaktivieren
// Update AdminNavbar:
const isLegacyMode = false; // Disable direct admin

// 2. Migration Banner entfernen
<MigrationBanner show={false} />

// 3. Success Message zeigen
<Alert type="success">
  ✅ MultiSig Migration erfolgreich!
  Alle Admin-Operations ab jetzt via MultiSig.
</Alert>
```

**Innerhalb 24 Stunden:**
- [ ] Test-Operation via MultiSig (z.B. kleine Fee-Änderung)
- [ ] Dokumentation updaten
- [ ] Team Retrospektive
- [ ] Monitoring prüfen

---

## 📋 Phase 4: Production Operation

**Ziel:** Normal MultiSig Workflows etablieren

### 4.1 Standard Operations

**Beispiel: Contract paussen (Emergency)**

```typescript
// Timeline: ~5-10 Minuten

// T+0: Owner 1 sieht Problem
// Öffnet /admin/multisig-wallet
// Submit pause() transaction

// T+2: Owner 2 bekommt Notification
// Reviewed transaction
// Confirms → Auto-Execute!

// T+5: Contract ist paused ✅

// Später: Unpause via same process
```

**Beispiel: Fee Adjustment (Normal)**

```typescript
// Timeline: ~1-2 Tage

// Day 1:
// Owner 1 creates fee change proposal
// Submits via MultiSig

// Day 2:
// Team diskutiert off-chain (Telegram/Discord)
// Owner 2 approved → Confirms
// Auto-Execute! ✅
```

### 4.2 Emergency Procedures

**Was wenn Owner nicht erreichbar?**

**Szenario 1: 1 Owner offline**
```
✅ Kein Problem!
- Brauchen nur 2/3 = 2 von 3 Owners
- Dritter Owner ist Optional
```

**Szenario 2: 2 Owners offline**
```
⚠️ Blockiert!
- Brauchen mindestens 2 Confirmations
- Müssen warten bis Owner online
```

**Szenario 3: Owner Private Key verloren**
```
✅ Lösbar via MultiSig!
1. Andere 2 Owners submit removeOwner(lost_address)
2. Beide confirm → Execute ✅
3. Submit addOwner(new_address)
4. Beide confirm → Execute ✅
5. Neuer Owner ist aktiv!
```

### 4.3 Best Practices

**Response Times:**
```
Emergency (Pause/Security): < 30 Minuten
Normal Operations: < 24 Stunden
Complex Changes: 2-3 Tage Discussion
```

**Communication:**
```
Primary: Telegram/Discord Group
Backup: Email + Phone
Emergency: Direct calls
```

**Transaction Hygiene:**
```typescript
// Immer clear description in submit:
const description = "Emergency pause - exploit detected in listing #123";

// Immer verification before confirm:
// 1. Check transaction data
// 2. Verify target address
// 3. Review with other owners
// 4. Then confirm
```

---

## 🔄 Rollback Plan

**Falls Migration fehlschlägt:**

### Option 1: Ownership zurück transferieren

```typescript
// Falls acceptOwnership() noch nicht executed:
// Current owner ruft auf:
await diamond.cancelOwnershipTransfer(); // Falls implementiert

// Oder: Warte 7 Tage Timelock ab
// Dann automatisch cancelled
```

### Option 2: Emergency Admin

```typescript
// Falls im Diamond Contract implementiert:
// Emergency admin kann kritische Functions ausführen
// Ohne MultiSig (nur für Emergencies!)
```

### Option 3: Diamond Upgrade

```typescript
// Last Resort:
// Upgrade Diamond mit neuer Facet
// Die Ownership Management korrigiert
// (Braucht aber aktuellen Owner!)
```

---

## 📊 Success Metrics

**Technical:**
- ✅ Ownership Transfer erfolgreich
- ✅ Alle Test Cases passed
- ✅ Gas Costs im erwarteten Rahmen
- ✅ Frontend zeigt korrekte Stati
- ✅ Events werden korrekt emitted

**Operational:**
- ✅ Alle 3 Owners können operieren
- ✅ 2/3 Consensus funktioniert
- ✅ Transaction Execution zuverlässig
- ✅ < 30min Response Time (Emergency)
- ✅ < 24h Response Time (Normal)

**User Experience:**
- ✅ Admin UI ist intuitiv
- ✅ Transaction Status klar sichtbar
- ✅ Notifications funktionieren
- ✅ Keine Verwirrung über Modi

---

## 📅 Beispiel Timeline

```
Week 1-2: Frontend Integration
├─ MultiSig Contract Interface
├─ Admin UI Components
└─ Migration Banner

Week 3: Sepolia Testing
├─ Deploy Test Diamond
├─ Test Ownership Transfer
├─ Test Operations
└─ Test Error Cases

Week 4: Preparation
├─ Production Frontend Deploy
├─ Team Training
├─ Documentation
└─ Go/No-Go Meeting

Migration Day: (Choose weekend for low traffic)
├─ 09:00: Team standup
├─ 10:00: Execute migration
├─ 10:30: Verification
├─ 11:00: Test operation
└─ 12:00: Success celebration! 🎉

Week 5+: Production Operation
├─ Monitor operations
├─ Collect feedback
├─ Optimize workflows
└─ Document learnings
```

---

## ❓ FAQ

**Q: Können wir während der Migration noch admin operations machen?**  
A: Nein. Migration dauert nur ~5 Minuten, in der Zeit frozen.

**Q: Was wenn genau in der Migration ein Emergency ist?**  
A: Current owner kann BIS zum acceptOwnership() noch direkt agieren.

**Q: Können wir zurück zu Single-Owner?**  
A: Ja, via MultiSig: Transfer ownership zurück an EOA (braucht 2/3 Consensus).

**Q: Brauchen wir immer 2/3 für ALLE Operations?**  
A: >50% reicht für normale Ops (= 2 von 3). Owner Management braucht 2/3 (= auch 2 von 3).

**Q: Was kostet eine MultiSig Operation?**  
A: Mainnet: ~$10-30. Sepolia: Vernachlässigbar (Test-ETH).

**Q: Wie lange dauert eine normale Operation?**  
A: Submit (2 min) + Confirm (2 min) + Execute (auto) = ~5-10 Minuten total.

---

## 🎯 Next Action

**Aktuell:** Single-Owner Mode nutzen, parallel MultiSig vorbereiten

**Start mit:**
```bash
# 1. MultiSig Frontend Integration starten
cd src/services
mkdir multisig
# Implement MultiSigService.ts

# 2. Admin UI erweitern
# Add /admin/multisig-wallet pages

# 3. Testing auf Sepolia
# Use existing Sepolia MultiSig (0x2180...)

# 4. Migration planen
# Choose date, notify team
```

**Recommended Migration Date:** 2-3 Wochen nach Frontend fertig ✅
