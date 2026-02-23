import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import ProgramAttendancePage from './ProgramAttendancePage';

export default async function SubmitAttendancePage() {
  let user;

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }

    // Must complete Davening Programme application before submitting attendance
    const application = await getApplicationByUserId(user.id).catch(() => null);
    if (!isApplicationComplete(application)) {
      redirect('/application');
    }
  } catch (error) {
    redirect('/handler/sign-in');
  }

  return <ProgramAttendancePage user={user} />;
}

