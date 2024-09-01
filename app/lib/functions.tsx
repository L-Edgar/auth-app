//result object
export interface ResultObj {
  result?: any;
  status: boolean;
  reason: string;
}

/**
 *
 * @param
 *
 * @returns
 */
export const return_user_to_app = (auth_id?: string, access_token?: string) => {
  let fallback = sessionStorage.getItem("fallback");
  if (fallback) {
    sessionStorage.removeItem("fallback");
    window.location.assign(
      `${fallback}?auth_id=${auth_id}&user_count=${access_token}`
    );
  }
};
// Method for verifying password
export const verify_auth = (auth: string): boolean => {
  const lengthRegex: RegExp = /^.{8,}$/; // At least 8 characters
  const uppercaseRegex: RegExp = /[A-Z]/; // At least one uppercase letter
  const lowercaseRegex: RegExp = /[a-z]/; // At least one lowercase letter
  const digitRegex: RegExp = /\d/; // At least one digit
  const specialCharRegex: RegExp = /[!@#$%^&*(),.?":{}|<>]/; // At least one special character

  // Check if the password meets all criteria
  const isLengthValid: boolean = lengthRegex.test(auth);
  const isUppercaseValid: boolean = uppercaseRegex.test(auth);
  const isLowercaseValid: boolean = lowercaseRegex.test(auth);
  const isDigitValid: boolean = digitRegex.test(auth);
  const isSpecialCharValid: boolean = specialCharRegex.test(auth);

  // Return true if all criteria are met, otherwise false
  return (
    isLengthValid &&
    isUppercaseValid &&
    isLowercaseValid &&
    isDigitValid &&
    isSpecialCharValid
  );
};

//method for verifying email
export const verify_email = (email: string) => {
  const regex =
    /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/;
  if (email.match(regex)) {
    return true;
  } else {
    return false;
  }
};

export function verify_username(username: string): boolean {
  // Check if username has spaces
  if (username.includes(" ")) {
    return false;
  }

  // Check if username length is within the specified range
  const minLength = 3;
  const maxLength = 10;
  if (username.length < minLength || username.length > maxLength) {
    return false;
  }

  // Username meets all criteria
  return true;
}

// Method for verifying phone number
export const verify_phone = (phone: string): boolean => {
  // Check if the phone number consists of exactly 10 numeric digits, including the first zero
  const phoneRegex: RegExp = /^(?:\+256\d{9}|0\d{9})$/;
  // Check if the phone number follows the specified format
  return phoneRegex.test(phone);
};
