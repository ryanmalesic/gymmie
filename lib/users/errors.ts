import { type ActionFailure, isActionFailure } from "@/lib/action";
import { type UserInput } from "@/lib/users/schema";

export type UserActionError = ActionFailure<UserInput> | Error;

export function getUserActionErrorMessage(error: UserActionError): string {
  if (isActionFailure<UserInput>(error)) {
    return error.error.form?.join(" ") || "Unable to complete the request";
  }

  return error.message;
}
