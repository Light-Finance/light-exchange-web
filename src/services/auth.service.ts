import { ERRORS_MESSAGES } from "../consts/errors";
import { SIGN_IN, SIGN_UP } from "../consts/mutations";
import { ApiServiceHelpers, IApiServiceResponse } from "../helpers/apiServiceHelpers";
import { client } from "../helpers/apollo";
import { IUser } from "../models";


export class AuthService {
    static signUp= async (data: IUser): Promise<IApiServiceResponse<IUser>> => {
        try {
          const result = await client.mutate({
            variables: data,
            mutation: SIGN_UP
          });
          if (result.data) {
            return ApiServiceHelpers.constructDataResponse(result.data.signUp);
          }
          return ApiServiceHelpers.constructErrorResponse(ERRORS_MESSAGES.signUp);
        } catch (error:any) {
          if (error.message.includes("Failed") || error.message.includes("NetworkError"))
            return ApiServiceHelpers.constructErrorResponse(ERRORS_MESSAGES.server);
          return ApiServiceHelpers.constructErrorResponse(error.message);
        }
      };
      static signIn= async (data: IUser): Promise<IApiServiceResponse<IUser>> => {
        try {
          const result = await client.mutate({
            variables: data,
            mutation: SIGN_IN
          });
          if (result.data) {
            return ApiServiceHelpers.constructDataResponse(result.data.signIn);
          }
          return ApiServiceHelpers.constructErrorResponse(ERRORS_MESSAGES.signIn);
        } catch (error:any) {
          if (error.message.includes("Failed") || error.message.includes("NetworkError"))
            return ApiServiceHelpers.constructErrorResponse(ERRORS_MESSAGES.server);
          return ApiServiceHelpers.constructErrorResponse(error.message);
        }
      }
}