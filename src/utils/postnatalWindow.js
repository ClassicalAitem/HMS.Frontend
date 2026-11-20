export const POSTNATAL_VALIDITY_MS = 41 * 24 * 60 * 60 * 1000;

export const isPostnatalWindowActive = (deliveryAt, now = Date.now()) => {
  const deliveryTime = new Date(deliveryAt).getTime();
  return Number.isFinite(deliveryTime) &&
    deliveryTime <= now &&
    now < deliveryTime + POSTNATAL_VALIDITY_MS;
};

export const findActivePostnatalRecord = (records, now = Date.now()) => {
  let latestRecord = null;
  let latestDeliveryTime = -Infinity;

  for (const record of Array.isArray(records) ? records : []) {
    const deliveryTime = new Date(record?.delivery?.deliveryAt).getTime();
    if (
      Number.isFinite(deliveryTime) &&
      deliveryTime > latestDeliveryTime &&
      isPostnatalWindowActive(deliveryTime, now)
    ) {
      latestRecord = record;
      latestDeliveryTime = deliveryTime;
    }
  }

  return latestRecord;
};
