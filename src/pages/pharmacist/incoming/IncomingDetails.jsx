import React, { useEffect, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate } from 'react-router-dom'
import { getPrescriptionByPatientId, updatePrescription } from '@/services/api/prescriptionsAPI'
import { getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { getInventories, updateInventory } from '@/services/api/inventoryAPI'
import { AddDrugModal } from '@/components/modals'
import { hasStatus } from '@/utils/statusUtils'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import toast from 'react-hot-toast'

const IncomingDetails = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [prescriptions, setPrescriptions] = useState({
    active: [],
    history: []
  })

  const [patient, setPatient] = useState(null)
  const [inventory, setInventory] = useState([])
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetch = async () => {
      setLoading(true)
      setError(null)

      try {
        // inventory
        const invRes = await getInventories()
        const invData = invRes?.data ?? []
        if (mounted) setInventory(invData)

        // prescriptions
        const presRes = await getPrescriptionByPatientId(patientId)
        const presData = presRes?.data ?? presRes
        const list = Array.isArray(presData) ? presData : (presData ? [presData] : [])

        const active = list.filter(p => String(p.status).toLowerCase() !== 'completed')
        const history = list
          .filter(p => String(p.status).toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

        if (mounted) setPrescriptions({ active, history })

        // patient
        const pRes = await getPatientById(patientId)
        const pData = pRes?.data ?? pRes
        if (mounted) setPatient(pData)

      } catch (err) {
        console.error(err)
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [patientId])

  const calculateQuantity = (med) => {
  const freqMap = {
    'once daily': 1,
    'twice daily': 2,
    'three times daily': 3,
    'four times daily': 4,
  };

  const frequency = freqMap[med.frequency?.toLowerCase()] || 1;

  const days = parseInt(med.duration) || 1;

  return frequency * days;
};

  // 🔥 reusable render
 const renderMedications = (list = [], isHistory = false) => {
  if (!list.length) {
    return <div className="text-sm text-base-content/60">No data.</div>
  }

  const meds = list.flatMap(p => {
    // ✅ Determine who this prescription is for at prescription level
    const isForDependant = !!p.dependantId;

    return (p.medications || []).map(m => {
      const inv = inventory.find(i => i.name.toLowerCase() === m.drugName.toLowerCase());
      return {
        ...m,
        form: inv?.form,
        strength: inv?.strength,
        status: p.status,
        _id: p._id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        // ✅ Who the prescription is for
        isForDependant,
        dependantId: p.dependantId,
        patientId: p.patientId,
      };
    });
  });

  return (
    <div className="space-y-3">
      {meds.map((m, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg border ${isHistory ? 'bg-base-200 opacity-70' : 'bg-base-100'}`}
        >
          {/* ✅ Who is this for — banner at top of card */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-200">
            {m.isForDependant ? (
              <>
                <span className="badge badge-secondary badge-sm">Dependant</span>
                
              </>
            ) : (
              <span className="badge badge-primary badge-sm">Main Patient</span>
            )}
          </div>

          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{m.drugName}</div>
              <div className="text-sm text-base-content/70">
                {m.form || ''} {m.strength ? `• ${m.strength}` : ''}
              </div>
              <div className="text-sm">Dosage: {m.dosage}</div>
              <div className="text-sm">Frequency: {m.frequency}</div>
              <div className="text-sm">Duration: {m.duration}</div>
            </div>
            <div className="text-sm text-right space-y-1">
              <div>Status: {m.status}</div>
              <div className="text-xs text-base-content/60">
                Created: {m.createdAt
                  ? new Date(m.createdAt).toLocaleString('en-NG', {
                      timeZone: 'Africa/Lagos',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </div>
              {m.instructions && (
                <div className="text-xs mt-1">Instruction: {m.instructions}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const reduceInventoryStock = async (medications = []) => {
  const updates = medications.map(async (med) => {
    const inv = inventory.find(
      i => i.name.toLowerCase() === med.drugName.toLowerCase()
    );

    if (!inv) return;

    const qtyToRemove = calculateQuantity(med);

    const newStock = Math.max((inv.stock || 0) - qtyToRemove, 0);

    return updateInventory(inv._id, {
      stock: newStock
    });
  });

  return Promise.all(updates);
};
  // 🔥 actions
  const handleComplete = async () => {
    const activePrescriptions = prescriptions.active;
    if (!activePrescriptions.length) return

    const pid = patient?.id || patient?._id || patient?.patientId

    const promise = Promise.all([
  ...activePrescriptions.map(p =>
    updatePrescription(p._id, { status: 'completed' })
  ),

  updatePatientStatus(pid, {
    status: PATIENT_STATUS.PHARMACY_COMPLETED
  }),

  ...activePrescriptions.map(p =>
    reduceInventoryStock(p.medications)
  )
]);

    toast.promise(promise, {
      loading: 'Completing...',
      success: 'Completed',
      error: 'Failed'
    })

    try {
      await promise

  setInventory(prev =>
  prev.map(item => {
    const meds = activePrescriptions.flatMap(p => p.medications || []);

    const totalQtyToRemove = meds
      .filter(m => m.drugName.toLowerCase() === item.name.toLowerCase())
      .reduce((sum, m) => sum + calculateQuantity(m), 0);

    if (!totalQtyToRemove) return item;

    return {
      ...item,
      stock: Math.max((item.stock || 0) - totalQtyToRemove, 0)
    };
  })
);
     setPrescriptions(prev => {
  const updatedHistory = [
    ...activePrescriptions.map(p => ({ ...p, status: 'completed' })),
    ...prev.history
  ];

  return {
    active: [],
    history: updatedHistory
  };
});

      setPatient(prev => ({
        ...(prev || {}),
        status: PATIENT_STATUS.PHARMACY_COMPLETED
      }))

    } catch (e) {
      toast.error('Failed to complete')
    }
  }


  return (
    <PharmacistLayout>
      <div className="p-6">

        {/* header */}
        <div className="mb-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Prescription Details
            </h1>
            <p className="text-sm">
              {patient?.firstName} {patient?.lastName}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div className="p-6 border rounded-xl bg-base-100">

          {loading ? (
            <div className="h-20 bg-base-200 animate-pulse" />
          ) : error ? (
            <div className="text-error">Error loading</div>
          ) : (
            <>
              {/* ACTIVE */}
              <h3 className="font-medium mb-3">Active</h3>
              {renderMedications(prescriptions.active)}

              {/* BUTTONS */}
              {prescriptions.active.length > 0 && (
                <div className="mt-4 flex gap-3">
                  <button className="btn btn-primary btn-sm" onClick={handleComplete}>
                    Complete Pharmacy
                  </button>

                  <button
  className="btn btn-primary btn-sm"
  disabled={
    !patient ||
    prescriptions.active.length === 0 ||
    hasStatus(patient?.status, PATIENT_STATUS.AWAITING_INJECTION)
  }
onClick={async () => {
  const activePrescriptions = prescriptions.active;
  if (!activePrescriptions.length) return;

  const pid = patient?.id || patient?._id || patient?.patientId;
  if (!pid) return;

  const promise = Promise.all([
    // ✅ complete ALL prescriptions
    ...activePrescriptions.map(p =>
      updatePrescription(p._id, { status: 'completed' })
    ),

    // ✅ move patient to nurse
    updatePatientStatus(pid, {
      status: PATIENT_STATUS.AWAITING_INJECTION
    }),

    // ✅ deduct stock for ALL prescriptions
    ...activePrescriptions.map(p =>
      reduceInventoryStock(p.medications)
    )
  ]);

  toast.promise(promise, {
    loading: 'Completing & sending to nurse...',
    success: 'Sent to nurse',
    error: 'Failed'
  });

  try {
    await promise;

    // 🔥 update inventory UI instantly (correct aggregation)
    setInventory(prev =>
      prev.map(item => {
        const meds = activePrescriptions.flatMap(p => p.medications || []);

        const totalQtyToRemove = meds
          .filter(m => m.drugName.toLowerCase() === item.name.toLowerCase())
          .reduce((sum, m) => sum + calculateQuantity(m), 0);

        if (!totalQtyToRemove) return item;

        return {
          ...item,
          stock: Math.max((item.stock || 0) - totalQtyToRemove, 0)
        };
      })
    );

    // 🔥 move ALL to history
    setPrescriptions(prev => {
      const updatedHistory = [
        ...activePrescriptions.map(p => ({ ...p, status: 'completed' })),
        ...prev.history
      ];

      return {
        active: [],
        history: updatedHistory
      };
    });

    // ✅ update patient status
    setPatient(prev => ({
      ...(prev || {}),
      status: PATIENT_STATUS.AWAITING_INJECTION
    }));

  } catch (e) {
    toast.error('Failed to send to nurse');
  }
}}
>
  Complete & Send to Nurse
</button>
                </div>
              )}

              {/* HISTORY */}
              <h3 className="font-medium mt-6 mb-3">History</h3>
              {renderMedications(prescriptions.history, true)}
            </>
          )}

        </div>

        {isSelectModalOpen && (
          <AddDrugModal
            setIsSelectModalOpen={setIsSelectModalOpen}
            prescriptionPatient={prescriptions.active[0]}
          />
        )}

      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails