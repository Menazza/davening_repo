import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import AttendanceFormPage from './AttendanceFormPage';

export default async function SubmitAttendancePage() {
  let user;
  
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    redirect('/handler/sign-in');
  }

  return <AttendanceFormPage user={user} />;
}

