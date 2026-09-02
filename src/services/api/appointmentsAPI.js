import apiClient from './apiClient';

// Appointment API service aligned with docs at docs/backed Endpoints/appointment.md
// Endpoints use singular '/appointment'

export const getAllAppointments = async (params = {}) => {
  const url = '/appointment';
  const response = await apiClient.get(url, { params });
  return response;
};

export const getAppointmentById = async (id) => {
  if (!id) throw new Error('Appointment ID is required');
  const url = `/appointment/${id}`;
  const response = await apiClient.get(url);
  return response;
};

export const createAppointment = async (payload) => {
  const required = ['patientId', 'appointmentDate', 'appointmentTime', 'department'];
  for (const key of required) {
    if (!payload?.[key]) throw new Error(`${key} is required`);
  }
  const body = {
    patientId: payload.patientId,
    dependantId: payload.dependantId,
    consultationId: payload.consultationId,
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    department: payload.department,
    appointmentType: payload.appointmentType || 'consultation',
    procedureCode: payload.procedureCode,
    procedureName: payload.procedureName,
    serviceChargeId: payload.serviceChargeId,
    price: payload.price,
    notes: payload.notes,
  };
  const url = '/appointment';
  const response = await apiClient.post(url, body);
  return response;
};

export const updateAppointment = async (id, payload) => {
  if (!id) throw new Error('Appointment ID is required');
  const url = `/appointment/${id}`;
  const response = await apiClient.patch(url, payload);
  return response;
};

export default {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
};