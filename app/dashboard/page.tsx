import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
import { getActiveAnnouncements } from '@/lib/admin';
import { getUserProgramsWithDetails } from '@/lib/user-programs';
import { hasAcceptedTermsThisMonth } from '@/lib/terms';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  let user;
  let announcements = [];

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }

    const userPrograms = await getUserProgramsWithDetails(user.id).catch(() => []);
    if (userPrograms.length === 0) {
      redirect('/profile?enroll=true');
    }

    announcements = await getActiveAnnouncements().catch(() => []);
  } catch (error) {
    redirect('/login');
  }

  const announcementsData = announcements.map((a: any) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    created_at: a.created_at,
  }));

  const userPrograms = await getUserProgramsWithDetails(user.id).catch(() => []);
  const hasHandlerProgram = userPrograms.some((p: any) => p.name === 'Handler');
  const acceptedTermsThisMonth = await hasAcceptedTermsThisMonth(user.id).catch(() => false);
  const needsTermsAcceptance = hasHandlerProgram && !acceptedTermsThisMonth;

  return (
    <DashboardClient
      user={user}
      announcements={announcementsData}
      hasHandlerProgram={hasHandlerProgram}
      needsTermsAcceptance={needsTermsAcceptance}
    />
  );
}
