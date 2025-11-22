import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserEarnings } from '@/lib/attendance';
import { getActiveAnnouncements } from '@/lib/admin';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  let user;
  let earnings = null;
  let announcements = [];

  try {
    // Fetch all data in parallel on the server
    user = await getAuthenticatedUser();
    
    // Fetch earnings and announcements in parallel
    [earnings, announcements] = await Promise.all([
      getUserEarnings(user.id).catch(() => null),
      getActiveAnnouncements().catch(() => []),
    ]);
  } catch (error) {
    // If not authenticated, redirect to sign-in
    redirect('/handler/sign-in');
  }

  // Format earnings for client
  const earningsData = earnings ? {
    totalEarned: earnings.totalEarned,
    totalPaid: earnings.totalPaid,
    totalOwed: earnings.totalOwed,
  } : null;

  // Format announcements for client
  const announcementsData = announcements.map(a => ({
    id: a.id,
    title: a.title,
    message: a.message,
    created_at: a.created_at,
  }));

  return <DashboardClient user={user} earnings={earningsData} announcements={announcementsData} />;
}
