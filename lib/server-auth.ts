import 'server-only';
import { stackServerApp } from '@/stack/server';
import { getUserProfile, createUserProfile, User } from './auth';

/**
 * Get the authenticated user from Stack Auth and their profile
 * Throws an error if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User> {
  const stackUser = await stackServerApp.getUser({ or: 'throw' });
  
  // Get or create user profile
  let profile = await getUserProfile(stackUser.id);
  
  if (!profile) {
    // Create user profile if it doesn't exist
    profile = await createUserProfile(
      stackUser.id,
      stackUser.primaryEmail || '',
      stackUser.displayName || undefined
    );
  }
  
  return profile;
}

/**
 * Get the authenticated user from Stack Auth and their profile
 * Returns null if not authenticated
 */
export async function getAuthenticatedUserOrNull(): Promise<User | null> {
  try {
    return await getAuthenticatedUser();
  } catch (error) {
    return null;
  }
}

/**
 * Get the authenticated admin user
 * Throws an error if not authenticated or not an admin
 */
export async function getAuthenticatedAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Get the authenticated Hendler admin user
 * Throws an error if not authenticated or not a Hendler admin
 */
export async function getAuthenticatedHendlerAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin || user.admin_type !== 'hendler') {
    throw new Error('Hendler admin access required');
  }
  
  return user;
}

/**
 * Get the authenticated Kollel admin user
 * Throws an error if not authenticated or not a Kollel admin
 */
export async function getAuthenticatedKollelAdmin(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user.is_admin || user.admin_type !== 'kollel') {
    throw new Error('Kollel admin access required');
  }
  
  return user;
}
