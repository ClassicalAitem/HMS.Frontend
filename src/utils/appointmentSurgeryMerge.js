/**
 * Merges standalone Surgery records (created by Doctor / Medical Director)
 * into Appointment lists so all Appointment tabs (Front Desk, Surgeon, Doctor,
 * Medical Director, Nurse, SuperAdmin) can view and verify scheduled surgeries.
 */
export function mergeAppointmentsAndSurgeries(appointmentsList = [], surgeriesList = []) {
  const appts = Array.isArray(appointmentsList) ? appointmentsList : [];
  const surgs = Array.isArray(surgeriesList) ? surgeriesList : [];

  const existingApptIds = new Set(
    appts.map((a) => String(a?.id || a?._id || a?.appointmentId || '')).filter(Boolean)
  );

  const surgeryAsAppointments = surgs
    .filter((s) => {
      const linkedApptId = String(s?.appointmentId || '');
      return !linkedApptId || !existingApptIds.has(linkedApptId);
    })
    .map((s) => {
      const p = s?.patient || null;
      const d = s?.dependant || null;
      const subject = d || p;
      const subjectName = subject
        ? subject.fullName || `${subject.firstName || ''} ${subject.lastName || ''}`.trim()
        : null;

      return {
        ...s,
        id: s?._id || s?.id,
        _id: s?._id || s?.id,
        appointmentId: s?.appointmentId || s?._id || s?.id,
        patientId: s?.patientId,
        dependantId: s?.dependantId || null,
        dependant: d,
        patient: p,
        patientName: subjectName || s?.patientName || s?.patientId || 'Unknown',
        appointmentDate: s?.scheduledDate || s?.createdAt,
        date: s?.scheduledDate || s?.createdAt,
        appointmentTime: s?.startTime || '',
        time: s?.startTime || '',
        appointmentType: 'surgery',
        procedureName: s?.procedureName || 'Surgical Procedure',
        procedureCode: s?.procedureCode || '',
        department: s?.department || 'surgeon',
        status: s?.status || 'scheduled',
        isSurgeryRecord: true,
        raw: s,
      };
    });

  return [...surgeryAsAppointments, ...appts];
}
