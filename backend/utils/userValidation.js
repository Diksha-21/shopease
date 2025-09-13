export const parseJsonField = (value, fieldName) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new Error(`Invalid ${fieldName} format`);
  }
};

export const validateAddressFields = (address) => {
  const required = ['street', 'city', 'state', 'country', 'postalCode'];
  for (const field of required) {
    if (!address[field]) {
      throw new Error(`Address field '${field}' is required`);
    }
  }
};

export const attachProfileImage = (user, file) => {
  if (file) {
    user.profileImage = `/upload/uploads/profile-images/${file.filename}`;
  }
};
