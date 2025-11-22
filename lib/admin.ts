import { sql } from './db';

export interface ShulTime {
  id: string;
  day_of_week: number;
  service_name: string;
  time: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export async function getShulTimes(): Promise<ShulTime[]> {
  const result = await sql`
    SELECT * FROM shul_times
    ORDER BY day_of_week, time
  `;
  return result as ShulTime[];
}

export async function upsertShulTime(
  dayOfWeek: number,
  serviceName: string,
  time: string
): Promise<ShulTime> {
  const result = await sql`
    INSERT INTO shul_times (day_of_week, service_name, time)
    VALUES (${dayOfWeek}, ${serviceName}, ${time}::time)
    ON CONFLICT (day_of_week, service_name)
    DO UPDATE SET
      time = EXCLUDED.time,
      updated_at = NOW()
    RETURNING *
  `;
  return result[0] as ShulTime;
}

export async function deleteShulTime(id: string): Promise<void> {
  await sql`DELETE FROM shul_times WHERE id = ${id}`;
}

export async function createAnnouncement(
  title: string,
  message: string,
  createdBy: string,
  expiresAt?: string
): Promise<Announcement> {
  const result = await sql`
    INSERT INTO announcements (title, message, created_by, expires_at)
    VALUES (${title}, ${message}, ${createdBy}, ${expiresAt ? `${expiresAt}::timestamptz` : null})
    RETURNING *
  `;
  return result[0] as Announcement;
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const result = await sql`
    SELECT * FROM announcements
    WHERE is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
  `;
  return result as Announcement[];
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const result = await sql`
    SELECT * FROM announcements
    ORDER BY created_at DESC
  `;
  return result as Announcement[];
}

export async function updateAnnouncement(
  id: string,
  updates: {
    title?: string;
    message?: string;
    is_active?: boolean;
    expires_at?: string | null;
  }
): Promise<Announcement | null> {
  if (Object.keys(updates).length === 0) {
    const current = await sql`
      SELECT * FROM announcements WHERE id = ${id}
    `;
    return (current[0] as Announcement) || null;
  }

  // Get current announcement first
  const current = await sql`
    SELECT * FROM announcements WHERE id = ${id}
  `;

  if (!current || current.length === 0) {
    return null;
  }

  const currentAnn = current[0] as Announcement;

  // Merge updates
  const merged = {
    title: updates.title !== undefined ? updates.title : currentAnn.title,
    message: updates.message !== undefined ? updates.message : currentAnn.message,
    is_active: updates.is_active !== undefined ? updates.is_active : currentAnn.is_active,
    expires_at: updates.expires_at !== undefined ? updates.expires_at : currentAnn.expires_at,
  };

  try {
    const result = await sql`
      UPDATE announcements
      SET 
        title = ${merged.title},
        message = ${merged.message},
        is_active = ${merged.is_active},
        expires_at = ${merged.expires_at ? merged.expires_at : null}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Announcement | null;
  } catch (error) {
    console.error('Error updating announcement:', error);
    return null;
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await sql`DELETE FROM announcements WHERE id = ${id}`;
}

