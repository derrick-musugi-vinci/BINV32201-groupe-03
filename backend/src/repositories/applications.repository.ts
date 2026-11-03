import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";

interface CreateParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

interface FindByStudentParams {
  studentId: number;
}

interface FindByIdParams {
  id: number;
  studentId: number;
}

interface WithdrawParams {
  id: number;
  studentId: number;
}

export const createApplicationsRepository = (db: Db) => {
  const findByStudent = db.prepare<FindByStudentParams, ApplicationDbo>(`
    SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year, p.code AS period, a.student_id, a.message,
           a.status, a.applied_at
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = @studentId
    ORDER BY a.applied_at DESC, a.id DESC
  `);
  const findById = db.prepare<FindByIdParams, ApplicationDbo>(`
    SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year, p.code AS period, a.student_id, a.message,
           a.status, a.applied_at
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.id = @id AND a.student_id = @studentId
  `);
  const findActiveForOffer = db.prepare<{ offerId: number; studentId: number }, { id: number }>(`
    SELECT id FROM applications
    WHERE offer_id = @offerId AND student_id = @studentId
      AND status NOT IN ('REJECTED', 'WITHDRAWN')
  `);
  const insert = db.prepare<CreateParams, { id: number }>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
    RETURNING id
  `);
  const withdraw = db.prepare<WithdrawParams, { changes: number }>(`
    UPDATE applications SET status = 'WITHDRAWN'
    WHERE id = @id AND student_id = @studentId AND status = 'IN_PROGRESS'
    RETURNING id AS changes
  `);

  return {
    findByStudent: (studentId: number): ApplicationDbo[] => findByStudent.all({ studentId }),
    findById: (id: number, studentId: number): ApplicationDbo | undefined =>
      findById.get({ id, studentId }),
    hasActiveForOffer: (offerId: number, studentId: number): boolean =>
      findActiveForOffer.get({ offerId, studentId }) !== undefined,
    create: (offerId: number, studentId: number, message: string | null): number =>
      insert.get({ offerId, studentId, message })?.id ?? 0,
    withdraw: (id: number, studentId: number): boolean =>
      withdraw.get({ id, studentId }) !== undefined,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
