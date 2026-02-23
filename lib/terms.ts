import { sql } from './db';

/**
 * Record that the user accepted the programme terms (e.g. at start of month).
 */
export async function recordTermsAcceptance(userId: string): Promise<void> {
  await sql`
    INSERT INTO terms_acceptances (user_id, accepted_at)
    VALUES (${userId}, NOW())
  `;
}

/**
 * Check if the user has accepted terms for the current calendar month.
 * Returns true if they have at least one acceptance in the current month.
 */
export async function hasAcceptedTermsThisMonth(userId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM terms_acceptances
    WHERE user_id = ${userId}
      AND accepted_at >= date_trunc('month', CURRENT_DATE)::timestamptz
      AND accepted_at < date_trunc('month', CURRENT_DATE)::timestamptz + interval '1 month'
    LIMIT 1
  `;
  return result.length > 0;
}

/**
 * Get the date of the user's most recent terms acceptance, if any.
 */
export async function getLatestTermsAcceptance(userId: string): Promise<Date | null> {
  const result = await sql`
    SELECT accepted_at FROM terms_acceptances
    WHERE user_id = ${userId}
    ORDER BY accepted_at DESC
    LIMIT 1
  `;
  const row = result[0] as { accepted_at: string } | undefined;
  return row ? new Date(row.accepted_at) : null;
}
