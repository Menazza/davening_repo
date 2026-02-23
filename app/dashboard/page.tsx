import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getActiveAnnouncements } from '@/lib/admin';
import { getUserProgramsWithDetails } from '@/lib/user-programs';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import { hasAcceptedTermsThisMonth } from '@/lib/terms';
import DashboardClient from './DashboardClient';
import DashboardLoading from './DashboardLoading';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const isStackRedirect = searchParams._stack_redirect === '1';
  let user;
  let announcements = [];

  try {
    user = await getAuthenticatedUser();

    if (user.is_admin) {
      redirect('/admin');
    }

    // New users must complete the Davening Programme application first
    const application = await getApplicationByUserId(user.id).catch(() => null);
    if (!isApplicationComplete(application)) {
      redirect('/application');
    }

    const userPrograms = await getUserProgramsWithDetails(user.id).catch(() => []);
    if (userPrograms.length === 0) {
      redirect('/profile?enroll=true');
    }

    announcements = await getActiveAnnouncements().catch(() => []);
  } catch (error) {
    if (isStackRedirect) {
      return <DashboardLoading />;
    }
    redirect('/handler/sign-in');
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
