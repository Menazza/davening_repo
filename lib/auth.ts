import { sql } from './db';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  hebrew_name?: string;
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  account_type?: string;
  is_admin: boolean;
}

export async function getUserProfile(userIdOrEmail: string): Promise<User | null> {
  try {
    // Try by ID first (UUID format), then by email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);
    
    let result;
    if (isUUID) {
      result = await sql`
        SELECT * FROM user_profiles WHERE id = ${userIdOrEmail}
      `;
    } else {
      result = await sql`
        SELECT * FROM user_profiles WHERE email = ${userIdOrEmail}
      `;
    }
    
    return result[0] as User | null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<User> {
  try {
    // userId comes from Neon Auth (auth.users.id)
    const result = await sql`
      INSERT INTO user_profiles (id, email, full_name)
      VALUES (${userId}::uuid, ${email}, ${fullName || null})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name)
      RETURNING *
    `;
    return result[0] as User;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'is_admin'>>
): Promise<User | null> {
  if (Object.keys(updates).length === 0) {
    return getUserProfile(userId);
  }

  try {
    // Get current profile to preserve unchanged fields
    const current = await getUserProfile(userId);
    if (!current) {
      return null;
    }

    // Merge updates with current values
    const merged = {
      full_name: updates.full_name !== undefined ? updates.full_name : current.full_name,
      hebrew_name: updates.hebrew_name !== undefined ? updates.hebrew_name : current.hebrew_name,
      bank_name: updates.bank_name !== undefined ? updates.bank_name : current.bank_name,
      account_number: updates.account_number !== undefined ? updates.account_number : current.account_number,
      branch_code: updates.branch_code !== undefined ? updates.branch_code : current.branch_code,
      account_type: updates.account_type !== undefined ? updates.account_type : current.account_type,
    };

    // Update all fields (this is safe and simple with Neon)
    const result = await sql`
      UPDATE user_profiles
      SET 
        full_name = ${merged.full_name || null},
        hebrew_name = ${merged.hebrew_name || null},
        bank_name = ${merged.bank_name || null},
        account_number = ${merged.account_number || null},
        branch_code = ${merged.branch_code || null},
        account_type = ${merged.account_type || null},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    
    return result[0] as User | null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

