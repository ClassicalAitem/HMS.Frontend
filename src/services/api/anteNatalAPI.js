import apiClient from "./apiClient";

// Create a new antenatal record
export const createAnteNatalRecord = async (data) => {
  const response = await apiClient.post("/anteNatalRecord", data);
  return response.data;
};

// Get all antenatal records for a patient
export const getAnteNatalRecordByPatientId = async (patientId) => {
  const response = await apiClient.get("/anteNatalRecord", {
    params: { patientId },
  });

  const records = response.data?.data || response.data || [];
  return Array.isArray(records) ? records : [];
};

// Get all antenatal records
export const getAllAnteNatalRecords = async (params = {}) => {
  const response = await apiClient.get("/anteNatalRecord", {
    params,
  });

  const records = response.data?.data || response.data || [];
  return Array.isArray(records) ? records : [];
};

// Get a specific record by patientId + index
export const getAnteNatalRecord = async (patientId, index) => {
  const response = await apiClient.get(
    `/anteNatalRecord/${patientId}/${index}`,
    {
      timeout: 30000,
    }
  );

  return response.data?.data || response.data;
};

// Update a specific record by patientId + index
export const updateAnteNatalRecord = async (patientId, index, data) => {
  const response = await apiClient.patch(
    `/anteNatalRecord/${patientId}/${index}`,
    data,
    {
      timeout: 30000,
    }
  );

  return response.data?.data || response.data;
};

export const updateAnteNatalDelivery = async (patientId, recordId, data) => {
  if (!patientId || !recordId) throw new Error('Patient ID and antenatal record ID are required');
  const response = await apiClient.patch(
    `/anteNatalRecord/${patientId}/records/${recordId}/delivery`,
    data,
    { timeout: 30000 }
  );
  return response.data?.data || response.data;
};

export const unwrapAnteNatalRecords = (records, { isViewingDependant = false, dependantId = null } = {}) => {
  const unwrapped = Array.isArray(records)
    ? (records.some((r) => r?.presentPregnancy || r?.presentPregnancyHistories || r?.medicalHistories)
        ? records.map((r, i) => ({ ...r, __originalIndex: r.__originalIndex ?? i }))
        : records.flatMap((w) =>
            (w.anteNatalRecords || []).map((r, i) => ({ ...r, __wrapperId: w._id, __originalIndex: i }))
          ))
    : (Array.isArray(records?.anteNatalRecords)
        ? records.anteNatalRecords.map((r, i) => ({ ...r, __originalIndex: i }))
        : []);

  const scoped = isViewingDependant && dependantId
    ? unwrapped.filter((r) => String(r?.dependantId || '') === String(dependantId))
    : unwrapped.filter((r) => !r?.dependantId);

  return [...scoped].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};