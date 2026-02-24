import 'server-only';
import { cookies } from 'next/headers';
import { getUserProfile, User } from './auth';

const SESSION_COOKIE_NAME = 'session_user_id';

/**
 * Get the authenticated user from our session cookie and their profile.
 * Throws an error if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<User> {
  const store = cookies();
  const userId = store.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error('User not found');
  }

  return profile;
}

/**
 * Get the authenticated user from our session cookie and their profile.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUserOrNull(): Promise<User | null> {
  try {
    return await getAuthenticatedUser();
  } catch (error) {
    return null;
  }
}

/**
 * Get the authenticated admin user.
 * Throws an error if not authenticated or not an admin.
 */
export async function getAuthenticatedAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Get the authenticated Hendler admin user.
 * Throws an error if not authenticated or not a Hendler admin.
 */
export async function getAuthenticatedHendlerAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin || user.admin_type !== 'hendler') {
    throw new Error('Hendler admin access required');
  }
  
  return user;
}

/**
 * Get the authenticated Kollel admin user.
 * Throws an error if not authenticated or not a Kollel admin.
 */
export async function getAuthenticatedKollelAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin || user.admin_type !== 'kollel') {
    throw new Error('Kollel admin access required');
  }
  
  return user;
}