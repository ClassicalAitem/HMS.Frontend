const normalize = (value) => String(value || '').trim().toLowerCase();

const getInvestigationId = (investigation) => investigation?.id || investigation?._id;

const matchesSubject = (billing, investigation) => {
  const billingPatientId = billing.patientId || billing.patient?.id || billing.patient?._id;
  const investigationPatientId = investigation.patientId || investigation.patient?.id || investigation.patient?._id;
  const billingDependantId = billing.dependantId || billing.dependant?.id || billing.dependant?._id;
  const investigationDependantId = investigation.dependantId;
  const billingOpdPatientId = billing.opdPatientId || billing.opdPatient?.id || billing.opdPatient?._id;
  const investigationOpdPatientId = investigation.opdPatientId;

  if (investigationDependantId) {
    return String(billingDependantId) === String(investigationDependantId);
  }
  if (investigationOpdPatientId) {
    return String(billingOpdPatientId) === String(investigationOpdPatientId);
  }
  return String(billingPatientId) === String(investigationPatientId) && !billingDependantId;
};

const findBillingItem = (investigation, test, billings) => {
  const investigationId = getInvestigationId(investigation);
  const testName = normalize(typeof test === 'object' ? test.name || test.code : test);

  if (!Array.isArray(billings)) return null;

  const investigationBillId = investigation.billId;
  const matchingBillings = billings
    .filter((billing) => (
      !investigationBillId || String(billing.id || billing._id) === String(investigationBillId)
    ))
    .filter((billing) => matchesSubject(billing, investigation))
    .sort((first, second) => (
      new Date(second.updatedAt || second.createdAt || 0).getTime() -
      new Date(first.updatedAt || first.createdAt || 0).getTime()
    ));

  for (const billing of matchingBillings) {
    const items = billing.itemDetails || [];

    // 1. Match by linked investigation ID AND test name/description
    let item = items.find((billingItem) => {
      const linkedId = billingItem.investigationId || billingItem.investigationRequestId;
      if (!linkedId || String(linkedId) !== String(investigationId)) return false;
      if (!testName) return true;
      const desc = normalize(billingItem.description);
      return desc.includes(testName) || testName.includes(desc);
    });

    // 2. Match by linked investigation ID alone (if single test or description slightly differs)
    if (!item && investigationId) {
      item = items.find((billingItem) => {
        const linkedId = billingItem.investigationId || billingItem.investigationRequestId;
        return linkedId && String(linkedId) === String(investigationId);
      });
    }

    // 3. Fallback: match by description for matching subject billing
    if (!item && testName) {
      item = items.find((billingItem) => {
        if (!billingItem.description) return false;
        const desc = normalize(billingItem.description);
        return desc.includes(testName) || testName.includes(desc);
      });
    }

    if (item) return item;
  }

  return null;
};

export const isInvestigationTestVisible = (investigation, test, billings = []) => {
  const billingItem = findBillingItem(investigation, test, billings);
  if (!billingItem) return false;

  const hmoStatus = normalize(billingItem.hmoStatus);
  const paymentStatus = normalize(billingItem.paymentStatus);
  const isCleared = billingItem.isCleared === true;

  // 1. HMO Approved / Covered
  if (hmoStatus === 'approved' || hmoStatus === 'partial') {
    return true;
  }

  // 2. Self-Pay or Out-Of-Pocket Paid at Cashier
  if (paymentStatus === 'paid' || isCleared) {
    return true;
  }

  // 3. Fully covered by HMO with zero balance
  if (typeof billingItem.patientOwes === 'number' && billingItem.patientOwes === 0 && billingItem.hmoCovered > 0) {
    return true;
  }

  return false;
};

export const filterVisibleInvestigation = (investigation, billings = []) => {
  if (!investigation) return null;

  const rawTests = Array.isArray(investigation.tests) && investigation.tests.length > 0
    ? investigation.tests
    : (investigation.testName || investigation.investigationType ? [{ name: investigation.testName || investigation.investigationType }] : []);

  const visibleTests = rawTests
    .map((test) => {
      const billingItem = findBillingItem(investigation, test, billings);
      if (!billingItem) return null;

      const isVisible = isInvestigationTestVisible(investigation, test, billings);
      if (!isVisible) return null;

      const testObj = typeof test === 'object' ? { ...test } : { name: test };
      const hmoStatus = normalize(billingItem.hmoStatus);
      const paymentStatus = normalize(billingItem.paymentStatus);
      const isCleared = billingItem.isCleared === true;
      const isPaid = paymentStatus === 'paid' || isCleared;
      const isHmoCovered = hmoStatus === 'approved' || hmoStatus === 'partial';

      testObj.isPaid = isPaid;
      testObj.isCleared = isCleared;
      testObj.paymentStatus = billingItem.paymentStatus || (isCleared ? 'paid' : 'unpaid');
      // Only set hmoStatus if item is actually HMO covered/approved. If paid at cashier, strip HMO status so it displays as Paid self-pay.
      testObj.hmoStatus = isHmoCovered ? billingItem.hmoStatus : null;
      testObj.isHmoCovered = isHmoCovered;
      testObj.coverageType = isHmoCovered ? 'hmo' : isPaid ? 'self_pay' : 'unknown';

      return testObj;
    })
    .filter(Boolean);

  return visibleTests.length > 0 ? { ...investigation, tests: visibleTests } : null;
};
