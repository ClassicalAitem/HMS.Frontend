/**
 * Service Charge and Test Pricing Resolver
 * 
 * Provides high-precision matching of ordered investigations, procedures,
 * and service charges to ensure accurate billing across Doctor consultation,
 * Billing modal, and Cashier details.
 */

/**
 * Normalizes a category string to standard types ('laboratory', 'radiology', 'surgical', etc.)
 * @param {string} category 
 * @returns {string}
 */
export const normalizeCategory = (category) => {
  const cat = String(category || '').toLowerCase().trim();
  if (cat === 'lab' || cat === 'laboratory') return 'laboratory';
  if (cat === 'radiology' || cat === 'rad') return 'radiology';
  if (cat === 'surgical' || cat === 'surgery') return 'surgical';
  return cat;
};

/**
 * Resolves a service charge and its price with strict precision.
 * 
 * Priority order:
 * 1. If isCustom is true, returns price 0 (or explicit custom price) without matching random charges.
 * 2. If serviceChargeId is provided, matches that ID exactly in serviceCharges.
 * 3. Priority within matching category (e.g. 'laboratory' or 'radiology'):
 *    a. Exact name match (case-insensitive, trimmed)
 *    b. Clean exact match (ignoring parentheses, hyphens, non-alphanumeric chars)
 *    c. Exact starts-with match
 *    d. Service charge contains query (only if query >= 3 chars)
 * 4. Falls back to cross-category search with the same priority if category pool yields nothing.
 * 5. Uses explicit price if provided and valid.
 * 
 * @param {Array} serviceCharges List of available service charges
 * @param {Object} options Search options
 * @param {string} options.name Test or service name
 * @param {string} [options.id] Service charge ID if known
 * @param {string} [options.category] Expected category (e.g. 'lab', 'laboratory', 'radiology')
 * @param {number} [options.price] Previously recorded price if available
 * @param {boolean} [options.isCustom] Whether this is a custom free-text entry
 * @returns {{ serviceChargeId: string|null, price: number, charge: Object|null }}
 */
export const resolveServiceCharge = (serviceCharges = [], { name = '', id = null, category = '', price = null, isCustom = false } = {}) => {
  const explicitPrice = Number(price);
  const hasValidExplicitPrice = Number.isFinite(explicitPrice) && explicitPrice > 0;

  if (isCustom) {
    return {
      serviceChargeId: null,
      price: hasValidExplicitPrice ? explicitPrice : 0,
      charge: null,
    };
  }

  const list = Array.isArray(serviceCharges) ? serviceCharges : [];

  // 1. By ID first (highest confidence)
  if (id) {
    const byId = list.find((c) => (c.id || c._id) === id);
    if (byId) {
      const chargePrice = Number(byId.amount ?? byId.price ?? 0);
      return {
        serviceChargeId: byId.id || byId._id,
        price: chargePrice > 0 ? chargePrice : (hasValidExplicitPrice ? explicitPrice : 0),
        charge: byId,
      };
    }
  }

  const norm = String(name || '').toLowerCase().trim();
  if (!norm) {
    return {
      serviceChargeId: null,
      price: hasValidExplicitPrice ? explicitPrice : 0,
      charge: null,
    };
  }

  const targetCategory = normalizeCategory(category);

  // Category filter
  const matchesTargetCategory = (c) => {
    if (!targetCategory) return true;
    const itemCat = normalizeCategory(c?.category);
    return itemCat === targetCategory;
  };

  const categoryPool = targetCategory ? list.filter(matchesTargetCategory) : [];
  // Candidate pools in order of preference: category-scoped pool first, then all charges
  const candidatePools = categoryPool.length > 0 ? [categoryPool, list] : [list];

  for (const pool of candidatePools) {
    // 2. Exact match (case-insensitive, trimmed)
    const exact = pool.find((c) => {
      const cName = String(c?.service || c?.name || '').toLowerCase().trim();
      return cName === norm;
    });
    if (exact) {
      const p = Number(exact.amount ?? exact.price ?? 0);
      return {
        serviceChargeId: exact.id || exact._id,
        price: p > 0 ? p : (hasValidExplicitPrice ? explicitPrice : 0),
        charge: exact,
      };
    }

    // 3. Clean exact match ignoring punctuation / parentheses: "Full Blood Count (FBC)" vs "Full Blood Count"
    const cleanNorm = norm.replace(/[^a-z0-9]/g, '');
    if (cleanNorm.length >= 2) {
      const cleanExact = pool.find((c) => {
        const cleanName = String(c?.service || c?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName === cleanNorm;
      });
      if (cleanExact) {
        const p = Number(cleanExact.amount ?? cleanExact.price ?? 0);
        return {
          serviceChargeId: cleanExact.id || cleanExact._id,
          price: p > 0 ? p : (hasValidExplicitPrice ? explicitPrice : 0),
          charge: cleanExact,
        };
      }
    }

    // 4. Starts with match (e.g. "Urinalysis Routine" starts with "Urinalysis")
    const startsWith = pool.find((c) => {
      const cName = String(c?.service || c?.name || '').toLowerCase().trim();
      return cName.startsWith(norm) || (cName.length >= 4 && norm.startsWith(cName));
    });
    if (startsWith) {
      const p = Number(startsWith.amount ?? startsWith.price ?? 0);
      return {
        serviceChargeId: startsWith.id || startsWith._id,
        price: p > 0 ? p : (hasValidExplicitPrice ? explicitPrice : 0),
        charge: startsWith,
      };
    }

    // 5. Service charge name contains query (only for queries with >= 3 characters)
    if (norm.length >= 3) {
      const contains = pool.find((c) => {
        const cName = String(c?.service || c?.name || '').toLowerCase().trim();
        return cName.includes(norm);
      });
      if (contains) {
        const p = Number(contains.amount ?? contains.price ?? 0);
        return {
          serviceChargeId: contains.id || contains._id,
          price: p > 0 ? p : (hasValidExplicitPrice ? explicitPrice : 0),
          charge: contains,
        };
      }
    }
  }

  // Fallback: If explicit price was recorded with the test, use it
  return {
    serviceChargeId: null,
    price: hasValidExplicitPrice ? explicitPrice : 0,
    charge: null,
  };
};

export default resolveServiceCharge;

