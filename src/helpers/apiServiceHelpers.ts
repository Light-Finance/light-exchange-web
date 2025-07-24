export interface IApiError {
  message: string;
}

export interface IApiServiceResponse<T> {
  data?: T;
  error?: IApiError;
}

const constructDataResponse = (data: any): IApiServiceResponse<any> => {
  return {
    data,
    error: undefined,
  } as IApiServiceResponse<any>;
};

const constructErrorResponse = (
  errorMessage: string,
): IApiServiceResponse<any> => {
  return {
    data: undefined,
    error: {message: errorMessage},
  } as IApiServiceResponse<any>;
};

export const ApiServiceHelpers = {
  constructDataResponse,
  constructErrorResponse,
};
