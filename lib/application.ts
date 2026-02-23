import { sql } from './db';

export interface DaveningApplication {
  id: string;
  user_id: string;
  firstname: string;
  surname: string;
  date_of_birth: string;
  contact_number: string;
  home_address: string;
  is_student: boolean;
  student_what: string | null;
  student_where: string | null;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_contact: string;
  availability_days: string[];
  cv_url: string | null;
  portrait_url: string | null;
  health_condition: boolean;
  health_condition_description: string | null;
  mental_health_condition: boolean;
  mental_health_receiving_help: boolean | null;
  mental_health_description: string | null;
  mental_health_need_help: boolean | null;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  popia_consent_at: string | null;
  application_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DaveningApplicationInsert = Omit<
  DaveningApplication,
  'id' | 'created_at' | 'updated_at'
> & {
  popia_consent_at?: string | null;
  application_submitted_at?: string | null;
};

export async function getApplicationByUserId(userId: string): Promise<DaveningApplication | null> {
  const result = await sql`
    SELECT * FROM davening_applications WHERE user_id = ${userId} LIMIT 1
  `;
  return (result[0] as DaveningApplication) || null;
}

export async function upsertApplication(
  userId: string,
  data: Partial<DaveningApplicationInsert> & { application_submitted_at?: string | null; popia_consent_at?: string | null }
): Promise<DaveningApplication | null> {
  const existing = await getApplicationByUserId(userId);

  const firstname = data.firstname ?? existing?.firstname ?? '';
  const surname = data.surname ?? existing?.surname ?? '';
  const date_of_birth = data.date_of_birth ?? existing?.date_of_birth ?? '';
  const contact_number = data.contact_number ?? existing?.contact_number ?? '';
  const home_address = data.home_address ?? existing?.home_address ?? '';
  const is_student = data.is_student ?? existing?.is_student ?? false;
  const student_what = data.student_what ?? existing?.student_what ?? null;
  const student_where = data.student_where ?? existing?.student_where ?? null;
  const next_of_kin_name = data.next_of_kin_name ?? existing?.next_of_kin_name ?? '';
  const next_of_kin_relationship = data.next_of_kin_relationship ?? existing?.next_of_kin_relationship ?? '';
  const next_of_kin_contact = data.next_of_kin_contact ?? existing?.next_of_kin_contact ?? '';
  const availability_days = data.availability_days ?? existing?.availability_days ?? [];
  const cv_url = data.cv_url !== undefined ? data.cv_url : existing?.cv_url ?? null;
  const portrait_url = data.portrait_url !== undefined ? data.portrait_url : existing?.portrait_url ?? null;
  const health_condition = data.health_condition ?? existing?.health_condition ?? false;
  const health_condition_description = data.health_condition_description !== undefined ? data.health_condition_description : existing?.health_condition_description ?? null;
  const mental_health_condition = data.mental_health_condition ?? existing?.mental_health_condition ?? false;
  const mental_health_receiving_help = data.mental_health_receiving_help !== undefined ? data.mental_health_receiving_help : existing?.mental_health_receiving_help ?? null;
  const mental_health_description = data.mental_health_description !== undefined ? data.mental_health_description : existing?.mental_health_description ?? null;
  const mental_health_need_help = data.mental_health_need_help !== undefined ? data.mental_health_need_help : existing?.mental_health_need_help ?? null;
  const bank_name = data.bank_name ?? existing?.bank_name ?? '';
  const account_holder_name = data.account_holder_name ?? existing?.account_holder_name ?? '';
  const account_number = data.account_number ?? existing?.account_number ?? '';
  const branch_code = data.branch_code ?? existing?.branch_code ?? '';
  const account_type = data.account_type ?? existing?.account_type ?? '';
  const popia_consent_at = data.popia_consent_at !== undefined ? data.popia_consent_at : existing?.popia_consent_at ?? null;
  const application_submitted_at = data.application_submitted_at !== undefined ? data.application_submitted_at : existing?.application_submitted_at ?? null;

  if (existing) {
    const result = await sql`
      UPDATE davening_applications SET
        firstname = ${firstname},
        surname = ${surname},
        date_of_birth = ${date_of_birth},
        contact_number = ${contact_number},
        home_address = ${home_address},
        is_student = ${is_student},
        student_what = ${student_what},
        student_where = ${student_where},
        next_of_kin_name = ${next_of_kin_name},
        next_of_kin_relationship = ${next_of_kin_relationship},
        next_of_kin_contact = ${next_of_kin_contact},
        availability_days = ${availability_days},
        cv_url = ${cv_url},
        portrait_url = ${portrait_url},
        health_condition = ${health_condition},
        health_condition_description = ${health_condition_description},
        mental_health_condition = ${mental_health_condition},
        mental_health_receiving_help = ${mental_health_receiving_help},
        mental_health_description = ${mental_health_description},
        mental_health_need_help = ${mental_health_need_help},
        bank_name = ${bank_name},
        account_holder_name = ${account_holder_name},
        account_number = ${account_number},
        branch_code = ${branch_code},
        account_type = ${account_type},
        popia_consent_at = ${popia_consent_at},
        application_submitted_at = ${application_submitted_at},
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result[0] as DaveningApplication;
  }

  const result = await sql`
    INSERT INTO davening_applications (
      user_id, firstname, surname, date_of_birth, contact_number, home_address,
      is_student, student_what, student_where, next_of_kin_name, next_of_kin_relationship, next_of_kin_contact,
      availability_days, cv_url, portrait_url, health_condition, health_condition_description,
      mental_health_condition, mental_health_receiving_help, mental_health_description, mental_health_need_help,
      bank_name, account_holder_name, account_number, branch_code, account_type,
      popia_consent_at, application_submitted_at
    ) VALUES (
      ${userId}, ${firstname}, ${surname}, ${date_of_birth}, ${contact_number}, ${home_address},
      ${is_student}, ${student_what}, ${student_where}, ${next_of_kin_name}, ${next_of_kin_relationship}, ${next_of_kin_contact},
      ${availability_days}, ${cv_url}, ${portrait_url}, ${health_condition}, ${health_condition_description},
      ${mental_health_condition}, ${mental_health_receiving_help}, ${mental_health_description}, ${mental_health_need_help},
      ${bank_name}, ${account_holder_name}, ${account_number}, ${branch_code}, ${account_type},
      ${popia_consent_at}, ${application_submitted_at}
    )
    RETURNING *
  `;
  return result[0] as DaveningApplication;
}

export function isApplicationComplete(app: DaveningApplication | null): boolean {
  if (!app || !app.application_submitted_at) return false;
  return !!(
    app.firstname &&
    app.surname &&
    app.date_of_birth &&
    app.contact_number &&
    app.home_address &&
    app.next_of_kin_name &&
    app.next_of_kin_relationship &&
    app.next_of_kin_contact &&
    app.bank_name &&
    app.account_holder_name &&
    app.account_number &&
    app.branch_code &&
    app.account_type &&
    app.popia_consent_at
  );
}
