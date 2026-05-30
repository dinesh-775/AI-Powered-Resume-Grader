/**
 * Password policy:
 * - at least 8 characters
 * - at least one lowercase letter
 * - at least one uppercase letter
 * - at least one number
 * - at least one special character
 *
 * Returns { valid: boolean, message: string }.
 */
export function validatePassword(password = "") {
  const value = String(password);

  if (value.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[a-z]/.test(value)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(value)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[0-9]/.test(value)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return { valid: false, message: "Password must contain at least one special character." };
  }

  return { valid: true, message: "" };
}
