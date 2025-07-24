import {
  IApiServiceResponse,
  ApiServiceHelpers,
} from "../helpers/apiServiceHelpers";
import { ERRORS_MESSAGES } from "../consts/errors";
import { IContactUs } from "../models";
import emailjs from "@emailjs/browser";
export class EmailService {
  static contactUs = async (
    data: IContactUs
  ): Promise<IApiServiceResponse<boolean>> => {
    await emailjs.init({
      publicKey: "IK6gWgj_EVxdIX_BN",
    });
    const templateParams = {
      to: "lightfinance237@gmail.com",
      from_name: data.email, // Replace with your name
      to_name: "Light Website", // Replace with recipient name
      subject: data.subject,
      message: data.description,
    };
    try {
      const response = await emailjs.send(
        "service_g7qnkti",
        "template_zgqbxow",
        templateParams
      );
      console.log(response);
      return ApiServiceHelpers.constructDataResponse("Great");
    } catch (error: any) {
      if (
        error.message.includes("Failed") ||
        error.message.includes("NetworkError")
      )
        return ApiServiceHelpers.constructErrorResponse(ERRORS_MESSAGES.server);
      return ApiServiceHelpers.constructErrorResponse(error.message);
    }
  };
}
