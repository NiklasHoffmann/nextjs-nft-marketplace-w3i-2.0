# hooks/ - Custom React Hooks

Reusable React hooks for common patterns and business logic.

## Quick Reference

### **Form Hook** (`useForm.ts`)
```typescript
import { useForm } from '@/hooks/useForm';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  price: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price')
});

function MyForm() {
  const {
    values,         // Form values
    errors,         // Validation errors
    touched,        // Touched fields
    isSubmitting,   // Submitting state
    handleChange,   // Input change handler
    handleBlur,     // Blur handler
    handleSubmit,   // Submit handler
    setFieldValue,  // Manual field update
    resetForm       // Reset to initial
  } = useForm({
    initialValues: { name: '', price: '' },
    validationSchema: schema,
    onSubmit: async (values) => {
      await api.submit(values);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <input 
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.name && errors.name && <span>{errors.name}</span>}
    </form>
  );
}
```

### **Modal Hook** (`useModal.ts`)
```typescript
import { useModal } from '@/hooks/useModal';

function MyComponent() {
  const { isOpen, open, close, toggle } = useModal();
  
  return (
    <>
      <button onClick={open}>Open Modal</button>
      <Modal isOpen={isOpen} onClose={close}>
        Content
      </Modal>
    </>
  );
}
```

### **Admin Status Hook** (`useAdminStatus.ts`)
```typescript
import { useAdminStatus } from '@/hooks/useAdminStatus';

function AdminPanel() {
  const { 
    isAdmin,        // Is current user admin?
    isLoading,      // Loading state
    checkAdminStatus // Manual recheck
  } = useAdminStatus();

  if (!isAdmin) return <AccessDenied />;
  return <AdminInterface />;
}
```

### **Card Tilt Hook** (`useCardTilt.ts`)
```typescript
import { useCardTilt } from '@/hooks/useCardTilt';

function NFTCard() {
  const { ref, style } = useCardTilt<HTMLDivElement>();
  
  return <div ref={ref} style={style}>Card Content</div>;
}
```

### **Horizontal Scroll Hook** (`useHorizontalScroll.ts`)
```typescript
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

function Gallery() {
  const scrollRef = useHorizontalScroll<HTMLDivElement>();
  
  return (
    <div ref={scrollRef} className="overflow-x-auto">
      {items.map(item => <Item key={item.id} />)}
    </div>
  );
}
```

## Hook Categories

### **NFT Hooks** (`nfts/`)
- `useNFTMetadata.ts` - Fetch NFT metadata
- `useNFTOwnership.ts` - Check NFT ownership
- `useNFTValidation.ts` - Validate NFT addresses/IDs

### **Marketplace Hooks** (`marketplace/`)
- `useMarketplaceEvents.ts` - Listen to marketplace events
- `useListingStatus.ts` - Check listing status
- `useCollectionWhitelist.ts` - Whitelist validation

### **Wallet Hooks** (`wallet/`)
- `useWalletConnection.ts` - Wallet connection state
- `useBalance.ts` - Wallet balance
- `useNFTApproval.ts` - NFT approval status

### **Interaction Hooks** (`interactions/`)
- `useUserInteractions.ts` - User favorites, ratings, watchlist
- `useNFTStats.ts` - NFT statistics

## Best Practices

### ✅ DO:
```typescript
// Encapsulate complex logic
function useComplexLogic() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Complex side effects
  }, [dependencies]);
  
  return { state, actions };
}

// Provide loading/error states
return { data, loading, error };

// Use TypeScript generics
function useData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  // ...
}
```

### ❌ DON'T:
```typescript
// Don't put hooks in conditions
if (condition) {
  const data = useHook(); // ❌
}

// Don't create too many hooks
// Bundle related logic together

// Don't forget cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // ✅
}, []);
```

## Naming Conventions

- **use** prefix (React convention)
- Descriptive names: `useNFTMetadata` not `useData`
- Return objects with clear names: `{ nft, loading, error }`

## Related Documentation

- **Form Validation**: See `useForm.ts` implementation
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)
