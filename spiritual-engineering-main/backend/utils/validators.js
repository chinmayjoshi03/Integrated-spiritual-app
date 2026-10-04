export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
  
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter.';
    }
  
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
  
    return null;
  };