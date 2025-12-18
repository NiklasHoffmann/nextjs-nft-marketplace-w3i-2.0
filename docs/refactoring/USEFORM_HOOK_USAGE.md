# useForm Hook - Usage Guide

## Overview

The `useForm` hook eliminates repetitive form state management code across components. It provides type-safe form handling with built-in validation, error management, and submission handling.

## Quick Start

### Basic Example

```tsx
import { useForm } from '@/hooks/useForm';

function MyForm() {
  const form = useForm({
    initialValues: {
      price: '',
      description: ''
    },
    validate: (values) => {
      const errors: any = {};
      if (!values.price) {
        errors.price = 'Price is required';
      }
      if (parseFloat(values.price) <= 0) {
        errors.price = 'Price must be greater than 0';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await createListing(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        {...form.getFieldProps('price')}
        placeholder="Price in ETH"
      />
      {form.hasError('price') && (
        <p className="error">{form.getFieldError('price')}</p>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## API Reference

### Configuration

```typescript
useForm({
  initialValues: T,              // Required: Initial form values
  validate?: (values) => errors, // Optional: Validation function
  schema?: ZodSchema,             // Optional: Zod schema for validation
  onSubmit?: (values) => void,    // Optional: Submit handler
  validateOnChange?: boolean,     // Default: false
  validateOnBlur?: boolean,       // Default: true
  resetOnSubmit?: boolean         // Default: false
})
```

### Return Value

```typescript
{
  // State
  values: T,                                    // Current form values
  errors: Partial<Record<keyof T, string>>,     // Field errors
  touched: Partial<Record<keyof T, boolean>>,   // Touched fields
  isSubmitting: boolean,                        // Submit status
  isDirty: boolean,                             // Has form changed?
  isValid: boolean,                             // Has no errors?
  
  // Setters
  setFieldValue: (field, value) => void,
  setValues: (values) => void,
  setFieldError: (field, error) => void,
  setErrors: (errors) => void,
  setFieldTouched: (field, touched) => void,
  
  // Methods
  validateForm: () => Promise<boolean>,
  validateField: (field) => Promise<void>,
  reset: () => void,
  handleSubmit: (e) => Promise<void>,
  
  // Helpers
  getFieldProps: (field) => { name, value, onChange, onBlur },
  getFieldError: (field) => string | undefined,
  hasError: (field) => boolean
}
```

## Examples

### 1. UpdateListingModal (Before & After)

**Before** (with manual state):
```tsx
function UpdateListingModal() {
  const [newPrice, setNewPrice] = useState('');
  const [desiredAddress, setDesiredAddress] = useState('');
  const [desiredTokenId, setDesiredTokenId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handlePriceChange = (e) => {
    setNewPrice(e.target.value);
    if (errors.newPrice) {
      setErrors(prev => ({ ...prev, newPrice: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: any = {};
    if (!newPrice || parseFloat(newPrice) <= 0) {
      newErrors.newPrice = 'Invalid price';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await updateListing({ price: newPrice });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={newPrice}
        onChange={handlePriceChange}
        className={errors.newPrice ? 'error' : ''}
      />
      {errors.newPrice && <p>{errors.newPrice}</p>}
    </form>
  );
}
```

**After** (with useForm):
```tsx
function UpdateListingModal() {
  const form = useForm({
    initialValues: {
      newPrice: '',
      desiredAddress: '',
      desiredTokenId: ''
    },
    validate: (values) => {
      const errors: any = {};
      if (!values.newPrice || parseFloat(values.newPrice) <= 0) {
        errors.newPrice = 'Invalid price';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await updateListing({ price: values.newPrice });
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input
        {...form.getFieldProps('newPrice')}
        className={form.hasError('newPrice') ? 'error' : ''}
      />
      {form.hasError('newPrice') && (
        <p>{form.getFieldError('newPrice')}</p>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
```

**Reduction**: ~40 lines → ~25 lines (37% reduction)

### 2. UnifiedListingForm (Complex Form)

```tsx
function UnifiedListingForm() {
  const form = useForm({
    initialValues: {
      price: '',
      currency: 'ETH',
      tradeType: 'specific',
      targetCollection: '',
      targetContractAddress: '',
      targetTokenId: '',
      description: ''
    },
    validate: (values) => {
      const errors: any = {};
      
      if (mode === 'sale' && (!values.price || parseFloat(values.price) <= 0)) {
        errors.price = 'Please enter a valid price';
      }
      
      if (mode === 'trade') {
        if (values.tradeType === 'specific' && !values.targetContractAddress) {
          errors.targetContractAddress = 'Please enter target NFT address';
        }
        if (values.tradeType === 'collection' && !values.targetCollection) {
          errors.targetCollection = 'Please enter collection address';
        }
      }
      
      if (!values.description.trim()) {
        errors.description = 'Please add a description';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      await createListing(values);
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      {mode === 'sale' && (
        <div>
          <label>Price *</label>
          <input
            type="number"
            {...form.getFieldProps('price')}
            className={form.hasError('price') ? 'border-red-300' : ''}
          />
          {form.hasError('price') && (
            <p className="error">{form.getFieldError('price')}</p>
          )}
        </div>
      )}
      
      <select {...form.getFieldProps('currency')}>
        <option value="ETH">ETH</option>
        <option value="USDC">USDC</option>
      </select>
      
      <textarea
        {...form.getFieldProps('description')}
        className={form.hasError('description') ? 'border-red-300' : ''}
      />
      
      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  );
}
```

### 3. With Zod Schema Validation

```tsx
import { z } from 'zod';

const listingSchema = z.object({
  price: z.string().refine(val => parseFloat(val) > 0, {
    message: 'Price must be greater than 0'
  }),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

function MyForm() {
  const form = useForm({
    initialValues: {
      price: '',
      description: ''
    },
    schema: listingSchema,
    onSubmit: async (values) => {
      await createListing(values);
    }
  });
  
  // Zod validation is automatically applied
  return <form onSubmit={form.handleSubmit}>...</form>;
}
```

### 4. Manual Field Control

```tsx
function AdvancedForm() {
  const form = useForm({
    initialValues: { price: '' }
  });
  
  // Manually set field value
  const handlePricePreset = (preset: string) => {
    form.setFieldValue('price', preset);
  };
  
  // Manually set error
  const validateCustom = async () => {
    const price = parseFloat(form.values.price);
    if (price > 100) {
      form.setFieldError('price', 'Price exceeds maximum allowed');
    }
  };
  
  // Manually reset form
  const handleReset = () => {
    form.reset();
  };
  
  return (
    <div>
      <button onClick={() => handlePricePreset('1.5')}>Set 1.5 ETH</button>
      <input {...form.getFieldProps('price')} />
      <button onClick={validateCustom}>Validate</button>
      <button onClick={handleReset}>Reset</button>
      
      <p>Dirty: {form.isDirty ? 'Yes' : 'No'}</p>
      <p>Valid: {form.isValid ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 5. Conditional Validation

```tsx
function ConditionalForm() {
  const [mode, setMode] = useState<'sale' | 'swap'>('sale');
  
  const form = useForm({
    initialValues: {
      price: '',
      targetNFT: ''
    },
    validate: (values) => {
      const errors: any = {};
      
      if (mode === 'sale') {
        if (!values.price) {
          errors.price = 'Price required for sale';
        }
      } else {
        if (!values.targetNFT) {
          errors.targetNFT = 'Target NFT required for swap';
        }
      }
      
      return errors;
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
        <option value="sale">Sale</option>
        <option value="swap">Swap</option>
      </select>
      
      {mode === 'sale' && (
        <input {...form.getFieldProps('price')} />
      )}
      
      {mode === 'swap' && (
        <input {...form.getFieldProps('targetNFT')} />
      )}
    </form>
  );
}
```

## Migration Strategy

### Identifying Forms to Migrate

Look for these patterns in your components:

```tsx
// Pattern 1: Manual state management
const [formData, setFormData] = useState({...});
const [errors, setErrors] = useState({});

// Pattern 2: handleChange boilerplate
const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};

// Pattern 3: Manual validation
const validateForm = () => {
  const newErrors = {};
  if (!formData.field) newErrors.field = 'Required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Pattern 4: Manual submit handling
const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  // submit logic
};
```

### Migration Steps

1. **Replace state with useForm**:
   ```tsx
   // Before
   const [formData, setFormData] = useState({...});
   const [errors, setErrors] = useState({});
   
   // After
   const form = useForm({ initialValues: {...} });
   ```

2. **Move validation logic**:
   ```tsx
   // Before
   const validateForm = () => {...};
   
   // After
   useForm({
     validate: (values) => {...}
   });
   ```

3. **Replace onChange handlers**:
   ```tsx
   // Before
   <input
     value={formData.field}
     onChange={(e) => handleInputChange('field', e.target.value)}
   />
   
   // After
   <input {...form.getFieldProps('field')} />
   ```

4. **Update error display**:
   ```tsx
   // Before
   {errors.field && <p>{errors.field}</p>}
   
   // After
   {form.hasError('field') && <p>{form.getFieldError('field')}</p>}
   ```

5. **Replace submit handler**:
   ```tsx
   // Before
   <form onSubmit={handleSubmit}>
   
   // After
   <form onSubmit={form.handleSubmit}>
   ```

## Components That Would Benefit

1. **UnifiedListingForm** (~350 lines → ~250 lines)
2. **BatchListingForm** (~650 lines → ~500 lines)
3. **UpdateListingModal** (~265 lines → ~180 lines) ✅
4. **Admin forms** (various, ~30-50 lines each)

**Total Estimated Savings**: ~400+ lines of boilerplate code

## Performance Notes

- **Memoized callbacks**: All functions are memoized with `useCallback`
- **Minimal re-renders**: Only re-renders when relevant state changes
- **Async validation**: Supports Promise-based validators
- **Schema caching**: Zod schemas are reused across renders

## TypeScript Benefits

- **Type-safe values**: Form values are fully typed
- **Autocomplete**: Full IDE support for field names
- **Error prevention**: Catches invalid field names at compile time

```tsx
interface FormValues {
  price: string;
  description: string;
}

const form = useForm<FormValues>({
  initialValues: { price: '', description: '' }
});

// ✅ TypeScript knows these fields exist
form.setFieldValue('price', '1.5');
form.getFieldProps('description');

// ❌ TypeScript error - field doesn't exist
form.setFieldValue('wrongField', 'value');
```

---

**Status**: ✅ Hook complete, ready for adoption
**Impact**: 367 lines of reusable form logic
**Next Step**: Migrate UnifiedListingForm and BatchListingForm
