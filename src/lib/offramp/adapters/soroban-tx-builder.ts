import * as StellarSdk from '@stellar/stellar-sdk';
import { randomBytes } from 'crypto';

/**
 * Convert float amount to on-chain integer representation
 */
function floatToInt(amount: string, decimals: number): bigint {
  const factor = BigInt(10 ** decimals);
  const floatAmount = parseFloat(amount);
  return BigInt(Math.floor(floatAmount * Number(factor)));
}

/**
 * Encode EVM address as 32-byte buffer (left-pad 20-byte address)
 */
function encodeEvmAddress(address: string): Buffer {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  const addressBuffer = Buffer.from(cleanAddress, 'hex');
  const paddedBuffer = Buffer.alloc(32);
  addressBuffer.copy(paddedBuffer, 12); // Left-pad with 12 zeros
  return paddedBuffer;
}

/**
 * Encode token address as 32-byte buffer
 */
function encodeTokenAddress(address: string): Buffer {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  const buffer = Buffer.from(cleanAddress, 'hex');
  if (buffer.length === 32) return buffer;
  
  const paddedBuffer = Buffer.alloc(32);
  buffer.copy(paddedBuffer, 32 - buffer.length); // Right-align
  return paddedBuffer;
}

/**
 * Generate random nonce as positive BigInt
 */
function generateNonce(): bigint {
  const buffer = randomBytes(32);
  const nonce = buffer.readBigInt64BE(0);
  return nonce < BigInt(0) ? BigInt(-1) * nonce : nonce;
}

interface BuildSwapAndBridgeTxParams {
  rpcUrl: string;
  sourceAccountPublicKey: string;
  contractAddress: string;
  abiSpec: string;
  amount: string;
  decimals: number;
  recipientEvmAddress: string;
  receiveTokenAddress: string;
}

/**
 * Build Soroban swap_and_bridge transaction
 */
export async function buildSwapAndBridgeTx(
  params: BuildSwapAndBridgeTxParams
): Promise<string> {
  const {
    rpcUrl,
    sourceAccountPublicKey,
    contractAddress,
    abiSpec,
    amount,
    decimals,
    recipientEvmAddress,
    receiveTokenAddress,
  } = params;

  // Connect to Soroban RPC
  const rpcServer = new StellarSdk.rpc.Server(rpcUrl);

  // Load source account
  const sourceAccount = await rpcServer.getAccount(sourceAccountPublicKey);

  // Convert amount to on-chain integer
  const amountInt = floatToInt(amount, decimals);

  // Encode recipient EVM address as 32-byte buffer
  const recipientBuffer = encodeEvmAddress(recipientEvmAddress);

  // Encode receive token address as 32-byte buffer
  const receiveTokenBuffer = encodeTokenAddress(receiveTokenAddress);

  // Generate random nonce
  const nonce = generateNonce();

  // Build contract call using ABI spec
  const contract = new StellarSdk.Contract(contractAddress);
  const spec = new StellarSdk.contract.Spec([abiSpec]);

  // Create invokeHostFunction operation
  const operation = contract.call(
    'swap_and_bridge',
    ...spec.funcArgsToScVals('swap_and_bridge', {
      amount: amountInt,
      recipient: recipientBuffer,
      receive_token: receiveTokenBuffer,
      nonce,
    })
  );

  // Build transaction
  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.PUBLIC,
  });

  const tx = txBuilder
    .addOperation(operation)
    .setTimeout(300)
    .build();

  // Simulate transaction
  const simulationResponse = await rpcServer.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simulationResponse)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulationResponse)}`);
  }

  // Extend auth entry expiration by +500 ledgers
  if (simulationResponse.result) {
    const authEntries = simulationResponse.result.auth || [];
    authEntries.forEach((entry: any) => {
      if (entry.credentials?.addressCredentials?.signatureExpirationLedger) {
        entry.credentials.addressCredentials.signatureExpirationLedger += 500;
      }
    });
  }

  // Assemble transaction with bumped fee (1.5x of base + minResourceFee)
  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulationResponse);
  
  const baseFee = parseInt(assembledTx.fee);
  const minResourceFee = parseInt(simulationResponse.minResourceFee || '0');
  const bumpedFee = Math.ceil((baseFee + minResourceFee) * 1.5);
  
  assembledTx.fee = bumpedFee.toString();

  // Return base64 XDR
  return assembledTx.toXDR();
}
