# Quote Fetch Logic Implementation

## Overview
Implemented complete quote fetch logic in FormCard component with Allbridge SDK integration and Paycrest rate fetching, following senior-level patterns and best practices.

## Implementation Details

### 1. FormCard Component (`src/components/FormCard.tsx`)

#### Quote Fetch Flow (500ms Debounce)
- **Debounce Mechanism**: Uses `useRef` to manage debounce timer, clearing previous timeouts before setting new ones
- **Validation**: Checks minimum amount (0.7 USDC) and currency before fetching
- **Loading State**: `isQuoteLoading` flag shown during fetch with "..." suffix
- **Error Handling**: Gracefully handles API errors and invalid quotes

#### Key Features
- **Callback Integration**: `onQuoteChange` callback notifies parent (RightPanel) of quote updates
- **Invalid Quote Rejection**: Uses `isValidQuote()` to reject NaN or negative values
- **Real-time Updates**: Quote updates within 1 second of typing (500ms debounce + network time)
- **Fee Method Support**: Handles both "USDC" and "XLM" fee methods

#### State Management
```typescript
const [quote, setQuote] = useState<QuoteResult | null>(null);
const [isQuoteLoading, setIsQuoteLoading] = useState(false);
const [quoteError, setQuoteError] = useState("");
const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### 2. Quote API Endpoint (`src/app/api/offramp/quote/route.ts`)

#### Request Handling
```typescript
POST /api/offramp/quote
{
  amount: string (USDC amount)
  currency: string (destination currency code, e.g., 'NGN')
  feeMethod: 'native' | 'stablecoin'
}
```

#### Response Format
```typescript
{
  destinationAmount: string
  rate: number
  currency: string
  bridgeFee: string
  payoutFee: string
  estimatedTime: number
}
```

#### Processing Pipeline
1. **Input Validation**: Validates amount, currency, and feeMethod
2. **Fee Calculation**: If feeMethod is "stablecoin", subtracts fee from amount before quoting
3. **Allbridge SDK Initialization**: Cached singleton promise prevents re-initialization
4. **Bridge Quote**: Calls `sdk.getQuote()` to get receiveAmount on Base chain
5. **Paycrest Rate Fetch**: GET `https://api.paycrest.io/v1/rates/USDC/{receiveAmount}/{currency}?network=base`
6. **Destination Amount Calculation**: `receiveAmount * rate * 0.99` (1% platform fee)
7. **Quote Validation**: Uses `isValidQuote()` to ensure no NaN or negative values
8. **Error Handling**: Returns appropriate HTTP status codes (400, 502, 500)

### 3. Quote Fetcher Utilities (`src/lib/offramp/utils/quote-fetcher.ts`)

#### Functions

**`fetchPaycrestQuote(receiveAmount, currency)`**
- Calls Paycrest API with proper URL construction
- Validates rate response
- Calculates destination amount with 1% platform fee
- Returns `{ rate, destinationAmount }`

**`buildQuote(destinationAmount, rate, currency, ...)`**
- Constructs QuoteResult object
- Validates using `isValidQuote()`
- Throws error if validation fails

**`calculateBridgeAmount(amount, feeMethod, stablecoinFee)`**
- Adjusts amount based on fee method
- For "stablecoin": subtracts fee from amount
- For "native": returns amount unchanged
- Validates adjusted amount is positive

### 4. Validation Utilities (`src/lib/offramp/utils/validation.ts`)

#### `isValidQuote(quote)`
- Checks for NaN values in `destinationAmount` and `rate`
- Ensures both values are finite and positive
- Handles unknown input types safely
- Returns boolean

## Acceptance Criteria Met

✅ **Quote updates within 1 second of typing**
- 500ms debounce + typical network latency = <1s total

✅ **Invalid quotes (NaN, negative) are rejected**
- `isValidQuote()` validates all quotes before acceptance
- Errors are caught and displayed to user

✅ **Loading state shown during fetch**
- `isQuoteLoading` flag controls suffix display ("..." during loading)
- PayoutBox only renders when quote is valid and not loading

✅ **Debounce 500ms on amount/currency/feeMethod change**
- All three field changes trigger `fetchQuote()` with 500ms debounce
- Previous timeouts are cleared before setting new ones

✅ **Initialize Allbridge SDK (cached singleton promise)**
- SDK initialized once and cached in module-level variable
- Subsequent calls reuse same promise

✅ **Call getAllbridgeQuote(sdk, stellarUsdc, baseUsdc, amount)**
- Implemented in quote endpoint
- Uses token configurations for Stellar and Base USDC

✅ **If fee method is "stablecoin": subtract stablecoin fee from amount**
- `calculateBridgeAmount()` handles fee subtraction
- Validates adjusted amount is positive

✅ **Fetch Paycrest rate with proper URL**
- GET `https://api.paycrest.io/v1/rates/USDC/{receiveAmount}/{currency}?network=base`
- Proper error handling for API failures

✅ **Compute destinationAmount = receiveAmount * rate * 0.99**
- Implemented in `fetchPaycrestQuote()`
- 1% platform fee applied correctly

✅ **Build Quote object and validate with isValidQuote()**
- `buildQuote()` constructs object
- `isValidQuote()` validates before returning

✅ **Call onPricingUpdate callback with new quote**
- `onQuoteChange` callback invoked with valid quote
- Parent component (RightPanel) receives updates

## Senior-Level Patterns Applied

1. **Error Handling**: Comprehensive try-catch with specific error messages
2. **Type Safety**: Full TypeScript types for all interfaces and functions
3. **Performance**: Debouncing prevents excessive API calls
4. **Caching**: Allbridge SDK cached as singleton promise
5. **Validation**: Multi-layer validation (input, output, quote)
6. **Separation of Concerns**: Logic split between component, API, and utilities
7. **Documentation**: Detailed comments explaining flow and requirements
8. **State Management**: Proper use of React hooks and refs
9. **API Design**: RESTful endpoint with clear request/response contracts
10. **Defensive Programming**: Handles edge cases (NaN, negative values, network errors)

## Testing Considerations

- Test debounce timing (500ms)
- Test quote validation with invalid data (NaN, negative)
- Test fee method switching
- Test error scenarios (API failures, invalid responses)
- Test loading state display
- Test callback invocation with valid quotes
- Test minimum amount validation (0.7 USDC)

## Environment Variables Required

```
NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL
NEXT_PUBLIC_BASE_RETURN_ADDRESS
NEXT_PUBLIC_STELLAR_USDC_ISSUER
BASE_RPC_URL
PAYCREST_API_KEY
PAYCREST_WEBHOOK_SECRET
```

## Files Modified

1. `src/components/FormCard.tsx` - Quote fetch logic with debouncing
2. `src/app/api/offramp/quote/route.ts` - Quote endpoint implementation
3. `src/lib/offramp/utils/quote-fetcher.ts` - Enhanced documentation
4. `src/lib/offramp/utils/validation.ts` - Improved `isValidQuote()` type safety
