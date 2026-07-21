export const FULL_NAME_REGEX = /^[A-Za-z\s\-\']{3,100}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;


export const validateFullName = (value) => {
    if (!value) return "Full Name is required.";
    if (!FULL_NAME_REGEX.test(value.trim())) return "Full name must be at least 3 characters and contain only letters, spaces, hyphens, or apostrophes.";
    return null;
};

export const validateEmail = (value) => {
    if (!value) return "Email Address is required.";
    if (!EMAIL_REGEX.test(value.trim())) return "Invalid email address format.";
    return null;
};

export const validatePhone = (value) => {
    if (!value) return "Contact Number is required.";
    if (!PHONE_REGEX.test(value.trim())) return "Contact number must be exactly 10 digits.";
    return null;
};

export const validatePincode = (value) => {
    if (!value) return "Pin Code is required.";
    if (!PINCODE_REGEX.test(value.trim())) return "Pin Code must be exactly 6 digits.";
    return null;
};

export const validatePassword = (value) => {
    if (!value) return "Password is required.";
    if (!PASSWORD_REGEX.test(value)) return "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    return null;
};

export const validatePasswordMatch = (password, confirmPassword) => {
    if (!confirmPassword) return "Confirm Password is required.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
};

export const getPasswordRules = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
});

