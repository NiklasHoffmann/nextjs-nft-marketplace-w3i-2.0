# Admin Components - System Management UI

Admin-specific components for system management, multi-signature operations, and administrative controls. Restricted to admin wallet addresses with session-based authentication.

## 📋 Table of Contents
- [Overview](#overview)
- [Components](#components)
  - [AdminModeIndicator](#adminmodeindicator)
  - [MigrationBanner](#migrationbanner)
  - [Multisig Components](#multisig-components)
- [Access Control](#access-control)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)

---

## Overview

**Location**: `components/admin/`  
**Purpose**: Admin-only UI components for system management  
**Access**: Restricted via signature-based authentication

### Component List
- **AdminModeIndicator.tsx** - Admin mode badge (read/write state)
- **MigrationBanner.tsx** - System migration notifications
- **multisig/** - Multi-signature wallet UI (4 components)
  - CreateProposalModal.tsx
  - ProposalCard.tsx
  - MultiSigTransactionCard.tsx
  - TransactionBuilder.tsx

### Access Control
✅ **AdminAuthGuard** - Route-level protection (page wrapper)  
✅ **AdminGuard** - Component-level protection (conditional render)  
✅ **Session-Based Auth** - 24h sessions with signature verification  
✅ **Read/Write Modes** - Granular permission control

---

## Components

### AdminModeIndicator

**File**: `admin/AdminModeIndicator.tsx`  
**Purpose**: Visual indicator for admin mode state (read-only vs write-enabled)

#### Props Interface

```typescript
interface AdminModeIndicatorProps {
  mode?: 'read' | 'write';
  className?: string;
}
```

#### Usage Examples

**Basic Indicator**
```typescript
import { AdminModeIndicator } from '@/components/admin';

<AdminModeIndicator mode="write" />
```

**Read-Only Mode (System Maintenance)**
```typescript
// Shows yellow badge when admin features are read-only
<AdminModeIndicator mode="read" />
// Renders: "🔒 Admin Mode (Read-Only)"
```

**Write Mode (Full Access)**
```typescript
// Shows green badge when full write access
<AdminModeIndicator mode="write" />
// Renders: "✅ Admin Mode (Write Enabled)"
```

**In Layout**
```typescript
export default function AdminLayout({ children }) {
  const { isAdmin, adminMode } = useAdminAccess();

  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>Admin Dashboard</h1>
        {isAdmin && <AdminModeIndicator mode={adminMode} />}
      </header>
      {children}
    </div>
  );
}
```

#### Styling

The indicator automatically styles based on mode:
- **Read Mode**: Yellow/amber warning badge
- **Write Mode**: Green success badge
- **Position**: Typically top-right corner or header

---

### MigrationBanner

**File**: `admin/MigrationBanner.tsx`  
**Purpose**: System-wide notifications for migrations and maintenance

#### Props Interface

```typescript
interface MigrationBannerProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  action?: ReactNode;
  onDismiss?: () => void;
  dismissible?: boolean;
}
```

#### Usage Examples

**Basic Banner**
```typescript
import { MigrationBanner } from '@/components/admin';

<MigrationBanner
  title="System Migration"
  message="The marketplace is being migrated to Diamond proxy. Read-only mode is enabled."
  type="warning"
/>
```

**With Action Button**
```typescript
<MigrationBanner
  title="Migration Complete"
  message="The system has been successfully migrated to the new contract."
  type="success"
  action={
    <button 
      onClick={handleRefresh}
      className="px-4 py-2 bg-white text-green-600 rounded-lg"
    >
      Refresh Page
    </button>
  }
/>
```

**Dismissible Banner**
```typescript
<MigrationBanner
  title="Maintenance Scheduled"
  message="System maintenance is scheduled for tonight at 2 AM UTC."
  type="info"
  dismissible={true}
  onDismiss={handleDismiss}
/>
```

#### Types

- **info** - Blue banner for informational messages
- **warning** - Yellow banner for warnings (e.g., read-only mode)
- **error** - Red banner for critical issues
- **success** - Green banner for completed actions

---

## Multisig Components

### CreateProposalModal

**File**: `admin/multisig/CreateProposalModal.tsx`  
**Purpose**: Create new multi-signature proposals for contract operations

#### Props Interface

```typescript
interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (proposal: MultisigProposal) => void;
}
```

#### Features

1. **Proposal Types** - 15+ operation types
   - Transfer Ownership
   - Set Innovation Fee
   - Whitelist Collection
   - Diamond Cut (upgrades)
   - Pause/Unpause Contract
   - Custom Function Calls

2. **Transaction Builder** - Visual interface for encoding function calls
3. **Validation** - Client-side validation for addresses, values, parameters
4. **Gas Estimation** - Preview gas costs before submission
5. **Multi-step Flow** - Type → Parameters → Review → Submit

#### Usage Example

```typescript
import { CreateProposalModal } from '@/components/admin/multisig';

function AdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleProposalCreated = useCallback((proposal: MultisigProposal) => {
    console.log('Proposal created:', proposal.id);
    refreshProposals();
    setIsCreateOpen(false);
  }, [refreshProposals]);

  return (
    <>
      <button onClick={() => setIsCreateOpen(true)}>
        Create Proposal
      </button>

      <CreateProposalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleProposalCreated}
      />
    </>
  );
}
```

#### Proposal Types

```typescript
type ProposalType =
  | 'TRANSFER_OWNERSHIP'
  | 'ACCEPT_OWNERSHIP'
  | 'SET_INNOVATION_FEE'
  | 'ADD_WHITELISTED_COLLECTION'
  | 'REMOVE_WHITELISTED_COLLECTION'
  | 'BATCH_ADD_COLLECTIONS'
  | 'BATCH_REMOVE_COLLECTIONS'
  | 'PAUSE_CONTRACT'
  | 'UNPAUSE_CONTRACT'
  | 'DIAMOND_CUT'
  | 'UPGRADE_FACET'
  | 'ADD_FACET'
  | 'REMOVE_FACET'
  | 'REPLACE_FACET'
  | 'CLEAN_LISTING'
  | 'CUSTOM';
```

---

### ProposalCard

**File**: `admin/multisig/ProposalCard.tsx` (240 lines)  
**Purpose**: Display individual proposal with voting actions

#### Props Interface

```typescript
interface ProposalCardProps {
  proposal: MultisigProposal;
  hasUserConfirmed: boolean;
  hasUserRejected: boolean;
  onConfirm: (proposalId: string) => Promise<void>;
  onReject: (proposalId: string) => Promise<void>;
  onExecute: (proposal: MultisigProposal) => Promise<void>;
  isLoading?: boolean;
}
```

#### Features

1. **Proposal Status** - Pending, Confirmed, Rejected, Executed, Expired
2. **Voting Progress** - Visual bar showing confirmations/rejections
3. **Signer List** - Who confirmed/rejected with timestamps
4. **Transaction Preview** - Decoded function calls
5. **Action Buttons** - Confirm, Reject, Execute (when ready)
6. **Expiration Timer** - Countdown for time-limited proposals

#### Usage Example

```typescript
import { ProposalCard } from '@/components/admin/multisig';

function ProposalList() {
  const { proposals } = useMultisigProposals();
  const { address } = useAccount();

  return (
    <div className="space-y-4">
      {proposals.map(proposal => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          hasUserConfirmed={proposal.confirmations.includes(address)}
          hasUserRejected={proposal.rejections.includes(address)}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onExecute={handleExecute}
        />
      ))}
    </div>
  );
}
```

#### Proposal States

```typescript
type ProposalStatus = 
  | 'PENDING'      // Awaiting votes
  | 'CONFIRMED'    // Enough confirmations, ready to execute
  | 'REJECTED'     // More rejections than confirmations
  | 'EXECUTED'     // Successfully executed on-chain
  | 'EXPIRED';     // Past deadline
```

---

### MultiSigTransactionCard

**File**: `admin/multisig/MultiSigTransactionCard.tsx`  
**Purpose**: Display pending multi-sig transactions from blockchain

#### Props Interface

```typescript
interface MultiSigTransactionCardProps {
  transaction: PendingMultiSigTx;
  onConfirm: (txIndex: number) => Promise<void>;
  onExecute: (txIndex: number) => Promise<void>;
  isLoading?: boolean;
}
```

#### Features

- **Transaction Data** - Decoded function calls, parameters
- **Confirmation Status** - Who has confirmed
- **Execution Readiness** - Visual indicator when ready
- **Direct Blockchain Actions** - Confirm/Execute transactions

#### Usage Example

```typescript
import { MultiSigTransactionCard } from '@/components/admin/multisig';

function PendingTransactions() {
  const { pendingTxs } = useMultisigPendingTransactions();

  return (
    <div className="grid gap-4">
      {pendingTxs.map((tx, index) => (
        <MultiSigTransactionCard
          key={index}
          transaction={tx}
          onConfirm={handleConfirm}
          onExecute={handleExecute}
        />
      ))}
    </div>
  );
}
```

---

### TransactionBuilder

**File**: `admin/multisig/TransactionBuilder.tsx`  
**Purpose**: Visual builder for encoding contract function calls

#### Features

1. **Function Selector** - Dropdown of available contract functions
2. **Parameter Inputs** - Dynamic form based on function ABI
3. **Value Field** - ETH value to send with transaction
4. **Encoding Preview** - Show encoded calldata
5. **Validation** - Type-safe parameter validation

#### Usage Example

```typescript
import { TransactionBuilder } from '@/components/admin/multisig';

function CustomProposal() {
  const [calldata, setCalldata] = useState('');

  return (
    <TransactionBuilder
      contractABI={marketplaceABI}
      onCalldataGenerated={(data) => {
        setCalldata(data);
        console.log('Encoded calldata:', data);
      }}
    />
  );
}
```

---

## Access Control

### AdminAuthGuard - Route Protection

**File**: `components/auth/AdminAuthGuard.tsx`  
**Usage**: Wrap entire pages

```typescript
import { AdminAuthGuard } from '@/components/auth';

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
```

**Features**:
- Signature-based authentication
- 24-hour sessions
- Automatic redirect to login
- Session refresh on activity

### AdminGuard - Component Protection

**File**: `components/auth/AdminGuard.tsx`  
**Usage**: Conditional rendering within pages

```typescript
import { AdminGuard } from '@/components/auth';

function MyPage() {
  return (
    <div>
      <h1>Public Content</h1>
      
      <AdminGuard fallback={<p>Admin access required</p>}>
        <AdminPanel />
      </AdminGuard>
    </div>
  );
}
```

### Access Control Utilities

```typescript
import { hasAdminAccess, isAdminReadOnlyMode } from '@/utils';

// Check admin access
if (hasAdminAccess(walletAddress)) {
  // Show admin features
}

// Check read-only mode
if (isAdminReadOnlyMode()) {
  // Disable write operations
}
```

---

## Usage Patterns

### Admin Dashboard Layout

```typescript
import { AdminAuthGuard, AdminModeIndicator } from '@/components/admin';

export default function AdminLayout({ children }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="flex justify-between items-center p-4">
            <h1>Admin Dashboard</h1>
            <AdminModeIndicator mode="write" />
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
```

### Multisig Proposal Workflow

```typescript
import { 
  CreateProposalModal, 
  ProposalCard 
} from '@/components/admin/multisig';

function MultisigDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { proposals, refresh } = useMultisigProposals();

  return (
    <div>
      <button onClick={() => setIsCreateOpen(true)}>
        Create Proposal
      </button>

      {/* Active proposals */}
      <div className="grid gap-4 mt-6">
        {proposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onExecute={handleExecute}
          />
        ))}
      </div>

      {/* Create modal */}
      <CreateProposalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(proposal) => {
          refresh();
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}
```

### Migration Banner Integration

```typescript
import { MigrationBanner } from '@/components/admin';

function App() {
  const { isMigrating, migrationStatus } = useMigrationStatus();

  return (
    <>
      {isMigrating && (
        <MigrationBanner
          title="System Migration in Progress"
          message={migrationStatus.message}
          type="warning"
        />
      )}
      <AppContent />
    </>
  );
}
```

---

## Best Practices

### ✅ DO

**Always Use Access Control**
```typescript
// ✅ Good - Protected admin page
export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminContent />
    </AdminAuthGuard>
  );
}
```

**Handle Read-Only Mode**
```typescript
// ✅ Good - Disable actions in read-only mode
function AdminActions() {
  const isReadOnly = isAdminReadOnlyMode();

  return (
    <button 
      onClick={handleAction}
      disabled={isReadOnly}
    >
      {isReadOnly ? 'Read-Only Mode' : 'Execute Action'}
    </button>
  );
}
```

**Validate Proposals Client-Side**
```typescript
// ✅ Good - Validate before submission
function validateProposal(proposal: ProposalData) {
  if (!isAddress(proposal.target)) {
    throw new Error('Invalid target address');
  }
  if (proposal.value < 0) {
    throw new Error('Value must be positive');
  }
  // ... more validation
}
```

### ❌ DON'T

**Don't Skip Authentication**
```typescript
// ❌ Bad - No auth check
export default function AdminPage() {
  return <AdminDashboard />;
}

// ✅ Good - With auth guard
export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
```

**Don't Execute Without Confirmations**
```typescript
// ❌ Bad - Execute without checking
async function executeProposal(proposal) {
  await execute(proposal);
}

// ✅ Good - Check confirmations first
async function executeProposal(proposal) {
  if (proposal.confirmations.length < requiredConfirmations) {
    throw new Error('Not enough confirmations');
  }
  if (proposal.status !== 'CONFIRMED') {
    throw new Error('Proposal not ready for execution');
  }
  await execute(proposal);
}
```

---

## Related Documentation

- [Core Components](../core/README.md)
- [NFT Components](../nft/README.md)
- [Main Components README](../README.md)
- [Admin Authentication](../../../docs/api/authentication.md)
- [Multisig Documentation](../../../docs/admin/MULTISIG_WALLET_INTEGRATION.md)
