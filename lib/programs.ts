import { sql } from './db';

export interface Program {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllPrograms(): Promise<Program[]> {
  const result = await sql`
    SELECT * FROM programs
    WHERE is_active = TRUE
    ORDER BY name
  `;
  return result as Program[];
}

export async function getProgramById(programId: string): Promise<Program | null> {
  const result = await sql`
    SELECT * FROM programs
    WHERE id = ${programId}
  `;
  return (result[0] as Program) || null;
}

export async function getProgramByName(name: string): Promise<Program | null> {
  const result = await sql`
    SELECT * FROM programs
    WHERE name = ${name} AND is_active = TRUE
  `;
  return (result[0] as Program) || null;
}
