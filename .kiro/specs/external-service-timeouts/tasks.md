# Implementation Plan: External Service Timeouts

## Overview

This implementation plan creates comprehensive timeout protection for all external service calls in API routes. The approach builds timeout wrappers with AbortController integration, applies service-specific timeout durations, and migrates existing API routes to use the new timeout mechanisms while preserving backward compatibility.

## Tasks

- [ ] 1. Create core timeout infrastructure
  - [x] 1.1 Implement TimeoutError class and core interfaces
    - Create TimeoutError class with service name, duration, and operation fields
    - Define TimeoutConfig and TimeoutResult interfaces
    - Add timeout configuration constants for each service type
    - _Requirements: 4.2, 4.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.2 Write property test for timeout configuration
    - **Property 1: Service-Specific Timeout Durations**
    - **Validates: Requirements 1.1, 2.1, 3.1, 6.1, 6.2, 6.3, 6.4**

  - [x] 1.3 Implement core timeout wrapper with AbortController
    - Create createAbortablePromise function with timeout and cancellation logic
    - Implement proper cleanup of timeout handlers and abort controllers
    - Add structured logging for timeout events and near-timeout warnings
    - _Requirements: 5.1, 5.2, 5.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 1.4 Write property test for timeout cancellation
    - **Property 2: Timeout Cancellation with AbortController**
    - **Validates: Requirements 1.2, 2.2, 3.2, 5.1, 5.2, 5.4**

- [ ] 2. Implement service-specific timeout wrappers
  - [x] 2.1 Create Allbridge SDK timeout wrapper
    - Implement withAllbridgeTimeout function with 30-second timeout
    - Add AbortSignal integration for SDK operations
    - Include operation-specific logging and error messages
    - _Requirements: 1.1, 1.2, 1.3, 5.3_

  - [x] 2.2 Create Paycrest API timeout wrapper
    - Implement withPaycrestTimeout function with 15-second timeout
    - Add proper request cancellation for HTTP calls
    - Include service-specific error messaging
    - _Requirements: 2.1, 2.2, 2.3, 5.3_

  - [x] 2.3 Create Soroban RPC timeout wrapper
    - Implement withSorobanTimeout function with 15-second timeout
    - Add AbortSignal support for RPC operations
    - Include blockchain-specific error handling
    - _Requirements: 3.1, 3.2, 3.3, 5.3_

  - [ ]* 2.4 Write property test for consistent error responses
    - **Property 3: Consistent Timeout Error Responses**
    - **Validates: Requirements 1.3, 2.3, 3.3, 4.1, 4.2, 4.3**

- [ ] 3. Checkpoint - Ensure timeout infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Migrate Allbridge SDK integration points
  - [x] 4.1 Update bridge gas fee options route
    - Wrap Allbridge SDK calls in src/app/api/offramp/bridge/gas-fee-options/route.ts
    - Apply withAllbridgeTimeout to SDK initialization and fee calculations
    - Preserve existing error handling for non-timeout errors
    - _Requirements: 1.1, 1.4, 7.1, 7.2_

  - [ ] 4.2 Update bridge build transaction routes
    - Wrap SDK calls in bridge build-tx and related routes
    - Apply timeout protection to transaction building operations
    - Maintain existing response formats for successful operations
    - _Requirements: 1.1, 1.4, 7.3, 7.4_

  - [ ] 4.3 Update bridge status and submission routes
    - Wrap SDK calls in bridge status and submit-soroban routes
    - Apply timeout protection to status checking and submission operations
    - Preserve existing error handling patterns
    - _Requirements: 1.1, 1.4, 7.1, 7.2_

  - [ ]* 4.4 Write property test for backward compatibility
    - **Property 4: Backward Compatibility Preservation**
    - **Validates: Requirements 1.4, 2.4, 3.4, 7.1, 7.2, 7.3, 7.4**

- [ ] 5. Migrate Paycrest API integration points
  - [ ] 5.1 Update Paycrest order management routes
    - Wrap API calls in src/app/api/offramp/paycrest/order routes
    - Apply withPaycrestTimeout to order creation and retrieval
    - Maintain existing Paycrest error handling for non-timeout errors
    - _Requirements: 2.1, 2.4, 7.1, 7.2_

  - [ ] 5.2 Update offramp quote and status routes
    - Wrap Paycrest calls in quote and status routes
    - Apply timeout protection to rate quotes and status checks
    - Preserve existing response formats
    - _Requirements: 2.1, 2.4, 7.3, 7.4_

  - [ ] 5.3 Update currency and institution routes
    - Wrap API calls in currencies and institutions routes
    - Apply timeout protection to metadata fetching operations
    - Maintain existing error handling patterns
    - _Requirements: 2.1, 2.4, 7.1, 7.2_

  - [ ]* 5.4 Write property test for AbortSignal integration
    - **Property 5: AbortSignal Integration**
    - **Validates: Requirements 5.3**

- [ ] 6. Migrate Soroban RPC integration points
  - [ ] 6.1 Update Soroban transaction submission routes
    - Wrap RPC calls in submit-soroban and related routes
    - Apply withSorobanTimeout to transaction submission operations
    - Preserve existing Soroban error handling for non-timeout errors
    - _Requirements: 3.1, 3.4, 7.1, 7.2_

  - [ ] 6.2 Update transaction status polling routes
    - Wrap RPC calls in tx-status and bridge status routes
    - Apply timeout protection to transaction status polling
    - Maintain existing response formats for successful operations
    - _Requirements: 3.1, 3.4, 7.3, 7.4_

  - [ ]* 6.3 Write property test for timeout logging
    - **Property 6: Comprehensive Timeout Logging**
    - **Validates: Requirements 4.4, 8.1, 8.2, 8.4**

- [ ] 7. Checkpoint - Ensure migration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Add comprehensive monitoring and logging
  - [ ] 8.1 Enhance timeout logging with structured data
    - Add request context and operation details to timeout logs
    - Include service performance metrics in log entries
    - Implement near-timeout warning logs for operations >80% of timeout
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.2 Write property test for near-timeout warnings
    - **Property 7: Near-Timeout Warning Logs**
    - **Validates: Requirements 8.3**

  - [ ] 8.3 Update error response standardization integration
    - Ensure timeout errors use standardized error response format
    - Integrate with existing error handler for consistent formatting
    - Add timeout-specific error codes and metadata
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 8.4 Write unit tests for API route integration
    - Test timeout behavior in actual API route contexts
    - Verify 504 Gateway Timeout responses
    - Test interaction with existing error handling middleware
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Final integration and validation
  - [ ] 9.1 Wire all timeout wrappers into remaining routes
    - Apply timeout protection to any remaining external service calls
    - Ensure consistent timeout behavior across all API routes
    - Verify proper cleanup and resource management
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Write integration tests for end-to-end timeout scenarios
    - Test complete request flows with timeout protection
    - Verify proper error propagation and response formatting
    - Test resource cleanup under various timeout conditions
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of timeout functionality
- Property tests validate universal correctness properties across all service types
- Unit tests validate specific integration points and edge cases
- All timeout wrappers preserve existing functionality while adding timeout protection
- Service-specific timeout durations: Allbridge SDK (30s), Paycrest API (15s), Soroban RPC (15s)