import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { sql } from '@/lib/db';
import { getUserProgramsWithDetails } from '@/lib/user-programs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const programId = searchParams.get('program_id'); // Optional: filter by program

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Get user's enrolled programs
    const userPrograms = await getUserProgramsWithDetails(user.id);
    const userProgramIds = userPrograms.map(p => p.id);

    // Build query - filter by program_id if provided, otherwise get all user's programs
    let attendanceQuery;
    if (programId && userProgramIds.includes(programId)) {
      // Get attendance for specific program
      attendanceQuery = sql`
        SELECT 
          a.came_early,
          a.learned_early,
          a.came_late,
          a.program_id,
          p.name as program_name
        FROM attendance a
        LEFT JOIN programs p ON p.id = a.program_id
        WHERE a.user_id = ${user.id}
          AND a.date >= ${startDate}::date
          AND a.date <= ${endDate}::date
          AND a.program_id = ${programId}
      `;
    } else {
      // Get attendance for all user's programs
      if (userProgramIds.length === 0) {
        return NextResponse.json({ stats: {}, statsByProgram: [] });
      }
      // Build query with IN clause for multiple program IDs
      // Use ANY with array for Neon compatibility
      attendanceQuery = sql`
        SELECT 
          a.came_early,
          a.learned_early,
          a.came_late,
          a.program_id,
          p.name as program_name
        FROM attendance a
        LEFT JOIN programs p ON p.id = a.program_id
        WHERE a.user_id = ${user.id}
          AND a.date >= ${startDate}::date
          AND a.date <= ${endDate}::date
          AND a.program_id = ANY(${userProgramIds}::uuid[])
      `;
    }

    const attendance = await attendanceQuery;

    // Calculate overall stats
    const stats = {
      totalDays: attendance.length,
      learningDays: attendance.filter((a: any) => a.learned_early).length,
      learningMinutes: attendance.filter((a: any) => a.learned_early).length * 5,
      earlyDays: attendance.filter((a: any) => a.came_early).length,
      lateDays: attendance.filter((a: any) => a.came_late).length,
      onTimeDays: attendance.filter((a: any) => !a.came_late && !a.came_early).length,
    };

    // Calculate stats by program
    const statsByProgram: Record<string, any> = {};
    userPrograms.forEach((program: any) => {
      const programAttendance = attendance.filter((a: any) => a.program_id === program.id);
      statsByProgram[program.id] = {
        programId: program.id,
        programName: program.name,
        totalDays: programAttendance.length,
        learningDays: programAttendance.filter((a: any) => a.learned_early).length,
        learningMinutes: programAttendance.filter((a: any) => a.learned_early).length * 5,
        earlyDays: programAttendance.filter((a: any) => a.came_early).length,
        lateDays: programAttendance.filter((a: any) => a.came_late).length,
        onTimeDays: programAttendance.filter((a: any) => !a.came_late && !a.came_early).length,
      };
    });

    // Also get kollel attendance stats
    let kollelAttendance;
    if (programId && userProgramIds.includes(programId)) {
      kollelAttendance = await sql`
        SELECT 
          ka.arrival_time,
          ka.departure_time,
          ka.program_id,
          p.name as program_name
        FROM kollel_attendance ka
        LEFT JOIN programs p ON p.id = ka.program_id
        WHERE ka.user_id = ${user.id}
          AND ka.date >= ${startDate}::date
          AND ka.date <= ${endDate}::date
          AND ka.program_id = ${programId}
      `;
    } else if (userProgramIds.length > 0) {
      kollelAttendance = await sql`
        SELECT 
          ka.arrival_time,
          ka.departure_time,
          ka.program_id,
          p.name as program_name
        FROM kollel_attendance ka
        LEFT JOIN programs p ON p.id = ka.program_id
        WHERE ka.user_id = ${user.id}
          AND ka.date >= ${startDate}::date
          AND ka.date <= ${endDate}::date
          AND ka.program_id = ANY(${userProgramIds}::uuid[])
      `;
    } else {
      kollelAttendance = [];
    }

    // Add kollel stats to program stats
    kollelAttendance.forEach((record: any) => {
      if (!statsByProgram[record.program_id]) {
        statsByProgram[record.program_id] = {
          programId: record.program_id,
          programName: record.program_name,
          totalDays: 0,
          learningDays: 0,
          learningMinutes: 0,
          earlyDays: 0,
          lateDays: 0,
          onTimeDays: 0,
          kollelDays: 0,
          totalKollelMinutes: 0,
        };
      }
      if (!statsByProgram[record.program_id].kollelDays) {
        statsByProgram[record.program_id].kollelDays = 0;
        statsByProgram[record.program_id].totalKollelMinutes = 0;
      }
      statsByProgram[record.program_id].kollelDays++;
      // Calculate minutes from arrival to departure
      const arrival = new Date(`2000-01-01T${record.arrival_time}`);
      const departure = new Date(`2000-01-01T${record.departure_time}`);
      const minutes = (departure.getTime() - arrival.getTime()) / (1000 * 60);
      statsByProgram[record.program_id].totalKollelMinutes += minutes;
    });

    return NextResponse.json({ 
      stats,
      statsByProgram: Object.values(statsByProgram)
    });
  } catch (error: any) {
    console.error('Get attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

