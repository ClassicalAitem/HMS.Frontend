import React from 'react';

export const errorFormatter = (error) => {
  if (error.message) {
    return error.message;
  }

  const { errors } = error;
  if (errors) {
    const errorList = Object.values(errors);

    if (errorList.length === 1) {
      return errorList[0];
    }

    return (
      <ul>
        {errorList.map((errorItem, index) => (
          <li key={index}>{errorItem}</li>
        ))}
      </ul>
    );
  }

  return 'An unknown error occurred';
};

export const dateFormatter = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
