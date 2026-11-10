/**
 * Modified Early Warning Score (MEWS) Clinical Calculator
 * Computes bedside physiological stability indicator from standard vitals.
 * Designed to provide calm, clear clinical indication without triggering panic or alarmism.
 */

export const parseSystolicBp = (bpVal) => {
  if (bpVal == null) return null;
  if (typeof bpVal === 'number') return bpVal;
  const str = String(bpVal).trim();
  const match = str.match(/^(\d{2,3})/);
  if (match) return parseInt(match[1], 10);
  return null;
};

export const calculateMews = ({
  bp,
  systolicBp,
  pulse,
  respiratoryRate,
  temperature,
  spo2,
} = {}) => {
  const sys = systolicBp != null ? Number(systolicBp) : parseSystolicBp(bp);
  const hr = pulse != null ? Number(pulse) : null;
  const rr = respiratoryRate != null ? Number(respiratoryRate) : null;
  const temp = temperature != null ? Number(temperature) : null;
  const ox = spo2 != null ? Number(spo2) : null;

  let totalScore = 0;
  let dataPointsCount = 0;
  const components = {};

  // 1. Systolic Blood Pressure
  if (sys != null && !isNaN(sys) && sys > 0) {
    dataPointsCount++;
    let score = 0;
    if (sys <= 70) score = 3;
    else if (sys <= 80) score = 2;
    else if (sys <= 100) score = 1;
    else if (sys <= 199) score = 0;
    else score = 2;
    components.systolic = { value: sys, score, label: 'Systolic BP' };
    totalScore += score;
  }

  // 2. Heart Rate / Pulse
  if (hr != null && !isNaN(hr) && hr > 0) {
    dataPointsCount++;
    let score = 0;
    if (hr < 40) score = 2;
    else if (hr <= 50) score = 1;
    else if (hr <= 100) score = 0;
    else if (hr <= 110) score = 1;
    else if (hr <= 129) score = 2;
    else score = 3;
    components.pulse = { value: hr, score, label: 'Pulse' };
    totalScore += score;
  }

  // 3. Respiratory Rate
  if (rr != null && !isNaN(rr) && rr > 0) {
    dataPointsCount++;
    let score = 0;
    if (rr < 9) score = 2;
    else if (rr <= 14) score = 0;
    else if (rr <= 20) score = 1;
    else if (rr <= 29) score = 2;
    else score = 3;
    components.respiratoryRate = { value: rr, score, label: 'Resp. Rate' };
    totalScore += score;
  }

  // 4. Body Temperature
  if (temp != null && !isNaN(temp) && temp > 0) {
    dataPointsCount++;
    let score = 0;
    if (temp < 35.0) score = 2;
    else if (temp <= 38.4) score = 0;
    else score = 2;
    components.temperature = { value: temp, score, label: 'Temperature' };
    totalScore += score;
  }

  // 5. Oxygen Saturation (SpO2)
  if (ox != null && !isNaN(ox) && ox > 0) {
    dataPointsCount++;
    let score = 0;
    if (ox >= 96) score = 0;
    else if (ox >= 94) score = 1;
    else if (ox >= 92) score = 2;
    else score = 3;
    components.spo2 = { value: ox, score, label: 'SpO2' };
    totalScore += score;
  }

  if (dataPointsCount === 0) {
    return {
      hasSufficientData: false,
      totalScore: 0,
      level: 'unknown',
      label: 'No Vitals Logged',
      badgeClass: 'badge-ghost',
      recommendation: 'Record vitals to evaluate physiological score',
      components,
    };
  }

  let level = 'normal';
  let label = 'Normal';
  let badgeClass = 'bg-success/15 text-success border border-success/30';
  let recommendation = 'Routine bedside observation';

  if (totalScore === 0 || totalScore === 1) {
    level = 'normal';
    label = 'Normal';
    badgeClass = 'bg-success/15 text-success border border-success/30';
    recommendation = 'Standard ward observations (4–6 hourly)';
  } else if (totalScore <= 3) {
    level = 'low';
    label = 'Low Risk';
    badgeClass = 'bg-info/15 text-info border border-info/30';
    recommendation = 'Monitor vital trends at scheduled shifts';
  } else if (totalScore <= 5) {
    level = 'moderate';
    label = 'Moderate';
    badgeClass = 'bg-warning/20 text-warning-content border border-warning/40 font-medium';
    recommendation = 'Increase observation frequency; notify attending nurse';
  } else {
    level = 'high';
    label = 'Review Suggested';
    badgeClass = 'bg-error/15 text-error border border-error/30 font-semibold';
    recommendation = 'Prompt clinical review by attending medical officer';
  }

  return {
    hasSufficientData: true,
    totalScore,
    level,
    label,
    badgeClass,
    recommendation,
    components,
    dataPointsCount,
  };
};

