import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import ApplicationClient from './ApplicationClient';
import ApplicationLoading from './ApplicationLoading';

export default async function ApplicationPage({
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
  } catch {
    if (isStackRedirect) return <ApplicationLoading />;
    redirect('/handler/sign-in');
  }

  const application = await getApplicationByUserId(user.id);
  const submitted = isApplicationComplete(application);

  return (
    <ApplicationClient
      user={user}
      initialApplication={application}
      alreadySubmitted={submitted}
    />
  );
}
