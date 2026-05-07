import React from 'react';

const CARD_TYPE_LABELS = {
  personal: 'Personal',
  family: 'Family',
  company: 'Company',
  emergency: 'Emergency'
};

const CARD_TYPE_STYLES = {
  personal: 'badge badge-info',
  family: 'badge badge-primary',
  company: 'badge badge-success',
  emergency: 'badge badge-error'
};

const PatientCardTypeInfo = ({ cardType = 'personal', familyName, companyName }) => {
  const normalizedCardType = String(cardType || 'personal').toLowerCase();
  const label = CARD_TYPE_LABELS[normalizedCardType] || CARD_TYPE_LABELS.personal;
  const badgeClass = CARD_TYPE_STYLES[normalizedCardType] || CARD_TYPE_STYLES.personal;

  const formatCardName = (value) => {
    if (!value) return '';
    return value
      .toString()
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={badgeClass}>{label} Card</span>
        {normalizedCardType === 'family' && familyName ? (
          <span className="text-sm text-base-content/80">Family Name:  <span className="font-semibold text-base-content">{formatCardName(familyName)}</span></span>
        ) : null}
        {normalizedCardType === 'company' && companyName ? (
          <span className="text-sm text-base-content/80">Company Name:  <span className="font-semibold text-base-content">{formatCardName(companyName)}</span></span>
        ) : null}
      </div>
    </div>
  );
};

export default PatientCardTypeInfo;
