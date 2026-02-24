import { sql } from './db';
import { enrollUserInProgram } from './user-programs';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ProgramJoinRequest {
  id: string;
  user_id: string;
  program_id: string;
  status: JoinRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * Create a join request (or return existing pending one)
 */
export async function createJoinRequest(
  userId: string,
  programId: string
): Promise<{ request: ProgramJoinRequest; alreadyExisted: boolean }> {
  const existing = await sql`
    SELECT * FROM program_join_requests
    WHERE user_id = ${userId} AND program_id = ${programId}
    LIMIT 1
  `;
  if (existing.length > 0) {
    const req = existing[0] as ProgramJoinRequest;
    if (req.status === 'pending') {
      return { request: req, alreadyExisted: true };
    }
    if (req.status === 'approved') {
      throw new Error('Already a member of this program');
    }
    // rejected: allow new request by updating to pending
    const updated = await sql`
      UPDATE program_join_requests
      SET status = 'pending', requested_at = NOW(), reviewed_at = NULL, reviewed_by = NULL
      WHERE id = ${req.id}
      RETURNING *
    `;
    return { request: updated[0] as ProgramJoinRequest, alreadyExisted: false };
  }
  const inserted = await sql`
    INSERT INTO program_join_requests (user_id, program_id, status)
    VALUES (${userId}, ${programId}, 'pending')
    RETURNING *
  `;
  return { request: inserted[0] as ProgramJoinRequest, alreadyExisted: false };
}

/**
 * Get join requests for the current user (all statuses)
 */
export async function getJoinRequestsByUser(userId: string) {
  const result = await sql`
    SELECT pjr.*, p.name AS program_name
    FROM program_join_requests pjr
    JOIN programs p ON p.id = pjr.program_id
    WHERE pjr.user_id = ${userId}
    ORDER BY pjr.requested_at DESC
  `;
  return result;
}

/**
 * Get pending join requests for admin (all programs or filter by program_id)
 */
export async function getPendingJoinRequests(programId?: string) {
  if (programId) {
    const result = await sql`
      SELECT pjr.*, p.name AS program_name, up.email, up.full_name
      FROM program_join_requests pjr
      JOIN programs p ON p.id = pjr.program_id
      JOIN user_profiles up ON up.id = pjr.user_id
      WHERE pjr.status = 'pending' AND pjr.program_id = ${programId}
      ORDER BY pjr.requested_at ASC
    `;
    return result;
  }
  const result = await sql`
    SELECT pjr.*, p.name AS program_name, up.email, up.full_name
    FROM program_join_requests pjr
    JOIN programs p ON p.id = pjr.program_id
    JOIN user_profiles up ON up.id = pjr.user_id
    WHERE pjr.status = 'pending'
    ORDER BY pjr.requested_at ASC
  `;
  return result;
}

/**
 * Get a single join request by id (for admin actions)
 */
export async function getJoinRequestById(
  requestId: string
): Promise<(ProgramJoinRequest & { program_name?: string }) | null> {
  const result = await sql`
    SELECT pjr.*, p.name AS program_name
    FROM program_join_requests pjr
    JOIN programs p ON p.id = pjr.program_id
    WHERE pjr.id = ${requestId}
  `;
  return (result[0] as ProgramJoinRequest & { program_name: string }) || null;
}

/**
 * Approve a join request: set status, enroll user in program
 */
export async function approveJoinRequest(
  requestId: string,
  adminUserId: string
): Promise<ProgramJoinRequest> {
  const req = await getJoinRequestById(requestId);
  if (!req) throw new Error('Join request not found');
  if (req.status !== 'pending') throw new Error('Request is not pending');

  await sql`
    UPDATE program_join_requests
    SET status = 'approved', reviewed_at = NOW(), reviewed_by = ${adminUserId}
    WHERE id = ${requestId}
  `;
  await enrollUserInProgram(req.user_id, req.program_id);

  const updated = await sql`
    SELECT * FROM program_join_requests WHERE id = ${requestId}
  `;
  return updated[0] as ProgramJoinRequest;
}

/**
 * Reject a join request
 */
export async function rejectJoinRequest(
  requestId: string,
  adminUserId: string
): Promise<ProgramJoinRequest> {
  const req = await getJoinRequestById(requestId);
  if (!req) throw new Error('Join request not found');
  if (req.status !== 'pending') throw new Error('Request is not pending');

  const result = await sql`
    UPDATE program_join_requests
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ${adminUserId}
    WHERE id = ${requestId}
    RETURNING *
  `;
  return result[0] as ProgramJoinRequest;
}

/**
 * Get status of user's request for a program (pending, approved, rejected, or none)
 */
export async function getJoinRequestStatus(
  userId: string,
  programId: string
): Promise<JoinRequestStatus | null> {
  const result = await sql`
    SELECT status FROM program_join_requests
    WHERE user_id = ${userId} AND program_id = ${programId}
    LIMIT 1
  `;
  return result.length > 0 ? (result[0] as { status: JoinRequestStatus }).status : null;
}
