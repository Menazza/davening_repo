import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import ProfileClient from './ProfileClient';
import ProfileLoading from './ProfileLoading';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const isStackRedirect = searchParams._stack_redirect === '1';
  let user;

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }

    // Must complete Davening Programme application before using profile
    const application = await getApplicationByUserId(user.id).catch(() => null);
    if (!isApplicationComplete(application)) {
      redirect('/application');
    }
  } catch (error) {
    if (isStackRedirect) {
      return <ProfileLoading />;
    }
    redirect('/handler/sign-in');
  }

  return <ProfileClient user={user} />;
}
