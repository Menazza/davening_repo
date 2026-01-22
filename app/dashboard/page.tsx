import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getActiveAnnouncements } from '@/lib/admin';
import { getUserProgramsWithDetails } from '@/lib/user-programs';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  let user;
  let announcements = [];

  try {
    // Fetch all data in parallel on the server
    user = await getAuthenticatedUser();
    
    // Redirect admins to admin portal
    if (user.is_admin) {
      redirect('/admin');
    }
    
    // Check if user has enrolled in any programs
    const userPrograms = await getUserProgramsWithDetails(user.id).catch(() => []);
    
    // If user has no programs, redirect to profile to enroll
    if (userPrograms.length === 0) {
      redirect('/profile?enroll=true');
    }
    
    // Fetch announcements
    announcements = await getActiveAnnouncements().catch(() => []);
  } catch (error) {
    // If not authenticated, redirect to sign-in
    redirect('/handler/sign-in');
  }

  // Format announcements for client
  const announcementsData = announcements.map(a => ({
    id: a.id,
    title: a.title,
    message: a.message,
    created_at: a.created_at,
  }));

  // Check if user has Handler program enrolled
  const userPrograms = await getUserProgramsWithDetails(user.id).catch(() => []);
  const hasHandlerProgram = userPrograms.some((p: any) => p.name === 'Handler');

  return <DashboardClient user={user} announcements={announcementsData} hasHandlerProgram={hasHandlerProgram} />;
}
