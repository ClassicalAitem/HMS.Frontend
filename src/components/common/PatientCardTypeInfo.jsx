import React from 'react';
import { CARD_TYPE_LABELS, CARD_TYPE_STYLES } from '@/constants/cardTypes';

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

  const formattedFamily = formatCardName(familyName);
  const formattedCompany = formatCardName(companyName);

  // Construct tooltip message based on card type
  const tooltipMessage =
    normalizedCardType === 'family' && formattedFamily
      ? `Family Surname: ${formattedFamily}`
      : normalizedCardType === 'company' && formattedCompany
      ? `Company: ${formattedCompany}`
      : `${label} Account`;

  return (
    <div className="relative group cursor-pointer inline-block">
      {/* Badge button */}
      <span className={`badge whitespace-nowrap font-medium ${badgeClass}`}>
        {label} Card
      </span>

      {/* Hover Tooltip Card */}
      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col items-start gap-1 rounded-lg border border-base-300 bg-base-100 p-2.5 shadow-xl text-xs z-30 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
        <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
          {label} Details
        </span>

        {normalizedCardType === 'family' && (
          <p className="text-base-content/80">
            Family Surname:{' '}
            <span className="font-semibold text-base-content">
              {formattedFamily || 'N/A'}
            </span>
          </p>
        )}

        {normalizedCardType === 'company' && (
          <p className="text-base-content/80">
            Company Name:{' '}
            <span className="font-semibold text-base-content">
              {formattedCompany || 'N/A'}
            </span>
          </p>
        )}

        {normalizedCardType === 'personal' && (
          <p className="text-base-content/70">Individual Patient Card</p>
        )}
      </div>
    </div>
  );
};

export default PatientCardTypeInfo;