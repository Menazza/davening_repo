import { sql } from './db';

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  enrolled_at: string;
}

/**
 * Get all programs a user is enrolled in
 */
export async function getUserPrograms(userId: string): Promise<UserProgram[]> {
  const result = await sql`
    SELECT up.* FROM user_programs up
    WHERE up.user_id = ${userId}
    ORDER BY up.enrolled_at DESC
  `;
  return result as UserProgram[];
}

/**
 * Get program details for programs a user is enrolled in
 */
export async function getUserProgramsWithDetails(userId: string) {
  const result = await sql`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.is_active,
      up.enrolled_at
    FROM user_programs up
    JOIN programs p ON p.id = up.program_id
    WHERE up.user_id = ${userId} AND p.is_active = TRUE
    ORDER BY p.name
  `;
  return result;
}

/**
 * Check if user is enrolled in a program
 */
export async function isUserEnrolledInProgram(
  userId: string,
  programId: string
): Promise<boolean> {
  const result = await sql`
    SELECT id FROM user_programs
    WHERE user_id = ${userId} AND program_id = ${programId}
  `;
  return result.length > 0;
}

/**
 * Enroll user in a program
 */
export async function enrollUserInProgram(
  userId: string,
  programId: string
): Promise<UserProgram> {
  const result = await sql`
    INSERT INTO user_programs (user_id, program_id)
    VALUES (${userId}, ${programId})
    ON CONFLICT (user_id, program_id) DO UPDATE SET enrolled_at = NOW()
    RETURNING *
  `;
  return result[0] as UserProgram;
}

/**
 * Unenroll user from a program
 */
export async function unenrollUserFromProgram(
  userId: string,
  programId: string
): Promise<void> {
  await sql`
    DELETE FROM user_programs
    WHERE user_id = ${userId} AND program_id = ${programId}
  `;
}

/**
 * Update user's program enrollments (replace all with new set)
 */
export async function updateUserPrograms(
  userId: string,
  programIds: string[]
): Promise<void> {
  // Start transaction by deleting all existing enrollments
  await sql`DELETE FROM user_programs WHERE user_id = ${userId}`;

  // Insert new enrollments
  if (programIds.length > 0) {
    for (const programId of programIds) {
      await sql`
        INSERT INTO user_programs (user_id, program_id)
        VALUES (${userId}, ${programId})
        ON CONFLICT (user_id, program_id) DO NOTHING
      `;
    }
  }
}
