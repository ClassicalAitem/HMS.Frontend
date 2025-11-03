import apiClient from './apiClient';

// Appointment API service aligned with docs at docs/backed Endpoints/appointment.md
// Endpoints use singular '/appointment'

export const getAllAppointments = async (params = {}) => {
  const url = '/appointment';
  console.log('📅 AppointmentsAPI: Fetching all appointments', { params, url });
  const response = await apiClient.get(url, { params });
  return response;
};

export const getAppointmentById = async (id) => {
  if (!id) throw new Error('Appointment ID is required');
  const url = `/appointment/${id}`;
  console.log('📅 AppointmentsAPI: Fetching appointment by ID', { id, url });
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
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    department: payload.department,
    appointmentType: payload.appointmentType || 'consultation',
    notes: payload.notes || '',
  };
  const url = '/appointment';
  console.log('📅 AppointmentsAPI: Creating appointment', { url, body });
  const response = await apiClient.post(url, body);
  return response;
};

export const updateAppointment = async (id, payload) => {
  if (!id) throw new Error('Appointment ID is required');
  const url = `/appointment/${id}`;
  console.log('📅 AppointmentsAPI: Updating appointment', { id, url, payload });
  const response = await apiClient.patch(url, payload);
  return response;
};

export default {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
};