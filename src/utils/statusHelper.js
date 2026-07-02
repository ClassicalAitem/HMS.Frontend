import { updatePatientStatus } from '@/services/api/patientsAPI';
import { updateDependantStatus } from '@/services/api/dependantAPI';

export const updateSubjectStatus = (patientId, dependantId, status) => {
  return dependantId
    ? updateDependantStatus(dependantId, { status })
    : updatePatientStatus(patientId, { status });
};