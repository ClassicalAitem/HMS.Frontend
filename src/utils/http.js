import axios from 'axios';

export const httpErrorCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  UNVERIFIED: 'Unverified Account'
};

const getAxiosError = (error) => {
  if (axios.isAxiosError(error)) {
    const errorResponse = error.response;
    if (errorResponse) {
      const statusCode = errorResponse.status;
      return { statusCode, errorData: errorResponse.data.message };
    }
    // Handle cases where error.response is undefined
    return { statusCode: httpErrorCodes.BAD_REQUEST, errorData: error.message };
  }
  // Handle non-Axios errors
  return {
    statusCode: httpErrorCodes.INTERNAL_SERVER_ERROR,
    errorData: error.message || 'An unknown error occurred'
  };
};

export default getAxiosError;
