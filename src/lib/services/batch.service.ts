import { db } from '@/lib/db/client';

export interface BatchTransaction {
  id: string;
  batchId: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export async function createBatch(userId: string, totalAmount: number) {
  const result = await db.query(
    `INSERT INTO transaction_batches (user_id, total_amount, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`,
    [userId, totalAmount]
  );
  return result.rows[0];
}

export async function addTransactionToBatch(
  batchId: string,
  transactionData: any
) {
  const result = await db.query(
    `INSERT INTO batch_transactions (batch_id, status)
     VALUES ($1, 'pending')
     RETURNING *`,
    [batchId]
  );
  return result.rows[0];
}

export async function updateBatchTransactionStatus(
  batchTransactionId: string,
  status: string,
  transactionId?: string,
  errorMessage?: string
) {
  return db.query(
    `UPDATE batch_transactions 
     SET status = $1, transaction_id = $2, error_message = $3
     WHERE id = $4
     RETURNING *`,
    [status, transactionId, errorMessage, batchTransactionId]
  );
}

export async function getBatchStatus(batchId: string) {
  const batch = await db.query(
    `SELECT * FROM transaction_batches WHERE id = $1`,
    [batchId]
  );
  const transactions = await db.query(
    `SELECT * FROM batch_transactions WHERE batch_id = $1`,
    [batchId]
  );
  return {
    batch: batch.rows[0],
    transactions: transactions.rows,
  };
}

export async function completeBatch(batchId: string) {
  return db.query(
    `UPDATE transaction_batches SET status = 'completed' WHERE id = $1 RETURNING *`,
    [batchId]
  );
}
