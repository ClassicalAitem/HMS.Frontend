// Environment configuration
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'HMS Frontend',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/user/login',
  LOGOUT: '/user/logout', // not yet implemented in backend
  REFRESH_TOKEN: '/user/refresh', // not yet implemented in backend
  CHANGE_PASSWORD: '/user/changePassword',
  FORGOT_PASSWORD: '/user/forgot-password',
  RESET_PASSWORD: '/user/resetPassword',

  // Billing
  CREATE_BILL: '/billing/create',
  GET_BILLINGS: '/billing',
  GET_BILL_DETAILS: '/billing/:id',

  // Receipts
  CREATE_RECEIPT: '/receipt/create',
  GET_RECEIPTS: '/receipt',
  GET_RECEIPT_BY_PATIENT_ID: '/receipt/patient/:patientId',

  // Patients
  PATIENTS: '/patient',
  PATIENT_DETAILS: '/patients/:id',

  // Users
  USERS: '/user',
  USER_PROFILE: '/users/profile',
  CREATE_STAFF: '/user/createStaff',
  CREATE_ADMIN: '/user/createAdmin',
  UPDATE_USER: '/user/updateUser',
  DISABLE_ACCOUNT: '/user/accountDisabled',

  // HMO
  GET_HMOS: '/hmo',


  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAILS: '/appointments/:id',

  // Medical Records
  PATIENT_VITALS: '/patient-vitals',
  LAB_RESULTS: '/lab-results',

  // Payments
  PAYMENTS: '/payments',
  BILLS: '/bills',

  // Reports
  REPORTS: '/reports',
};

export default config;

