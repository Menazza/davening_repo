import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  let user;
  
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    redirect('/handler/sign-in');
  }

  return <ProfileClient user={user} />;
}
