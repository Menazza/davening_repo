import { sql } from './db';

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  admin_id: string | null;
  created_at: string;
}

export async function createPayment(
  userId: string,
  amount: number,
  paymentDate: string,
  notes: string | null,
  adminId: string
): Promise<PaymentRecord> {
  const result = await sql`
    INSERT INTO payments (user_id, amount, payment_date, notes, admin_id)
    VALUES (${userId}, ${amount}, ${paymentDate}::date, ${notes}, ${adminId})
    RETURNING *
  `;
  return result[0] as PaymentRecord;
}

export async function getUserPayments(
  userId: string
): Promise<PaymentRecord[]> {
  const result = await sql`
    SELECT * FROM payments
    WHERE user_id = ${userId}
    ORDER BY payment_date DESC, created_at DESC
  `;
  
  // Convert numeric values from database (which may be strings) to numbers
  return result.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount || 0),
    payment_date: row.payment_date,
    notes: row.notes,
    admin_id: row.admin_id,
    created_at: row.created_at,
  }));
}

export async function getUserEarningsHistory(
  userId: string
): Promise<
  Array<{
    date: string;
    amount_earned: number;
    on_time_bonus: number;
    early_bonus: number;
    learning_bonus: number;
    is_weekend: boolean;
    program_id: string | null;
    program_name: string | null;
  }>
> {
  const result = await sql`
    SELECT DISTINCT ON (e.date)
      e.date, 
      e.amount_earned, 
      e.on_time_bonus, 
      e.early_bonus, 
      e.learning_bonus, 
      e.is_weekend,
      a.program_id,
      p.name as program_name
    FROM earnings e
    LEFT JOIN attendance a ON a.user_id = e.user_id AND a.date = e.date
    LEFT JOIN programs p ON p.id = a.program_id
    WHERE e.user_id = ${userId}
    ORDER BY e.date DESC, a.created_at DESC
  `;
  
  // Convert numeric values from database (which may be strings) to numbers
  return result.map((row: any) => ({
    date: row.date,
    amount_earned: Number(row.amount_earned || 0),
    on_time_bonus: Number(row.on_time_bonus || 0),
    early_bonus: Number(row.early_bonus || 0),
    learning_bonus: Number(row.learning_bonus || 0),
    is_weekend: Boolean(row.is_weekend),
    program_id: row.program_id || null,
    program_name: row.program_name || null,
  }));
}

