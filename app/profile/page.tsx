import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  let user;

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }
  } catch (error) {
    redirect('/login');
  }

  return <ProfileClient user={user} />;
}

