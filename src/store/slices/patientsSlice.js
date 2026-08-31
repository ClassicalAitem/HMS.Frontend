import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../../services/api/patientsAPI';
import { getErrorMessage } from '../../utils/errorHandler';

// Initial state
const initialState = {
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 PatientsSlice: Fetching patients...');
      const response = await getPatients();
      console.log('✅ PatientsSlice: Patients fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ PatientsSlice: Fetch patients error caught:', error);
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch patients'));
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async (patientId, { rejectWithValue }) => {
    try {
      console.log('🔄 PatientsSlice: Fetching patient by ID:', patientId);
      const response = await getPatientById(patientId);
      console.log('✅ PatientsSlice: Patient fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ PatientsSlice: Fetch patient by ID error caught:', error);
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch patient'));
    }
  }
);

export const addPatient = createAsyncThunk(
  'patients/addPatient',
  async (patientData, { rejectWithValue }) => {
    try {
      console.log('🔄 PatientsSlice: Creating new patient...');
      const response = await createPatient(patientData);
      console.log('✅ PatientsSlice: Patient created successfully');
      return response;
    } catch (error) {
      console.error('❌ PatientsSlice: Create patient error caught:', error);
      return rejectWithValue(getErrorMessage(error, 'Failed to create patient'));
    }
  }
);

export const editPatient = createAsyncThunk(
  'patients/editPatient',
  async ({ patientId, updateData }, { rejectWithValue }) => {
    try {
      console.log('🔄 PatientsSlice: Updating patient:', patientId);
      const response = await updatePatient(patientId, updateData);
      console.log('✅ PatientsSlice: Patient updated successfully');
      return response;
    } catch (error) {
      console.error('❌ PatientsSlice: Update patient error caught:', error);
      return rejectWithValue(getErrorMessage(error, 'Failed to update patient'));
    }
  }
);

export const removePatient = createAsyncThunk(
  'patients/removePatient',
  async (patientId, { rejectWithValue }) => {
    try {
      console.log('🔄 PatientsSlice: Deleting patient:', patientId);
      const response = await deletePatient(patientId);
      console.log('✅ PatientsSlice: Patient deleted successfully');
      return { patientId, response };
    } catch (error) {
      console.error('❌ PatientsSlice: Delete patient error caught:', error);
      return rejectWithValue(getErrorMessage(error, 'Failed to delete patient'));
    }
  }
);

// Slice
const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearPatientsError: (state) => {
      state.error = null;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Patients
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload.data || [];
        state.lastFetch = Date.now();
        console.log('📦 PatientsSlice: Patients state updated');
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('❌ PatientsSlice: Fetch patients rejected - setting error');
        console.log('📦 PatientsSlice: Rejection payload:', action.payload);
      })
      
      // Fetch Patient by ID
      .addCase(fetchPatientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentPatient = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPatient = action.payload.data;
        console.log('📦 PatientsSlice: Current patient state updated');
        console.log('📦 PatientsSlice: Patient data:', action.payload.data);
        console.log('📦 PatientsSlice: Patient ID:', action.payload.data?.id);
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('❌ PatientsSlice: Fetch patient by ID rejected - setting error');
      })
      
      // Add Patient
      .addCase(addPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.patients.unshift(action.payload.data);
        }
        console.log('📦 PatientsSlice: New patient added to state');
      })
      .addCase(addPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('❌ PatientsSlice: Add patient rejected - setting error');
      })
      
      // Edit Patient
      .addCase(editPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          const index = state.patients.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) {
            state.patients[index] = action.payload.data;
          }
          if (state.currentPatient?.id === action.payload.data.id) {
            state.currentPatient = action.payload.data;
          }
        }
        console.log('📦 PatientsSlice: Patient updated in state');
      })
      .addCase(editPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('❌ PatientsSlice: Edit patient rejected - setting error');
      })
      
      // Remove Patient
      .addCase(removePatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removePatient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = state.patients.filter(p => p.id !== action.payload.patientId);
        if (state.currentPatient?.id === action.payload.patientId) {
          state.currentPatient = null;
        }
        console.log('📦 PatientsSlice: Patient removed from state');
      })
      .addCase(removePatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('❌ PatientsSlice: Remove patient rejected - setting error');
      });
  },
});

export const { clearPatientsError, clearCurrentPatient, setCurrentPatient } = patientsSlice.actions;
export default patientsSlice.reducer;
