import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import ProgramAttendancePage from './ProgramAttendancePage';

export default async function SubmitAttendancePage() {
  let user;

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }
  } catch (error) {
    redirect('/login');
  }

  return <ProgramAttendancePage user={user} />;
}

