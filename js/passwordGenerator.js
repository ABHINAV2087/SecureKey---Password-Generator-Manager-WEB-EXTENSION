class PasswordGenerator {
    constructor() {
      this.lowercase = 'abcdefghijklmnopqrstuvwxyz';
      this.uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      this.numbers = '0123456789';
      this.symbols = '!@#$%^&*()_-+=<>?';
    }
  
    // Generate a random password based on options
    generatePassword(options) {
      const {
        length = 12,
        includeLowercase = true,
        includeUppercase = true,
        includeNumbers = true,
        includeSymbols = true
      } = options;
  
      // Ensure at least one character type is selected
      if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) {
        throw new Error('At least one character type must be selected');
      }
  
      // Build character pool based on options
      let charPool = '';
      if (includeLowercase) charPool += this.lowercase;
      if (includeUppercase) charPool += this.uppercase;
      if (includeNumbers) charPool += this.numbers;
      if (includeSymbols) charPool += this.symbols;
  
      // Generate password
      let password = '';
      const poolLength = charPool.length;
  
      // Make sure we have at least one character from each selected type
      if (includeLowercase) {
        password += this.getRandomChar(this.lowercase);
      }
      if (includeUppercase) {
        password += this.getRandomChar(this.uppercase);
      }
      if (includeNumbers) {
        password += this.getRandomChar(this.numbers);
      }
      if (includeSymbols) {
        password += this.getRandomChar(this.symbols);
      }
  
      // Fill the rest of the password with random characters
      const remainingLength = length - password.length;
      for (let i = 0; i < remainingLength; i++) {
        password += charPool.charAt(Math.floor(Math.random() * poolLength));
      }
  
      // Shuffle the password to ensure randomness
      return this.shuffleString(password);
    }
  
    // Get a random character from a string
    getRandomChar(str) {
      return str.charAt(Math.floor(Math.random() * str.length));
    }
  
    // Shuffle a string (Fisher-Yates algorithm)
    shuffleString(str) {
      const array = str.split('');
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array.join('');
    }
  
    // Evaluate password strength
    evaluateStrength(password) {
      if (!password) return { score: 0, feedback: 'No password provided' };
  
      let score = 0;
      const length = password.length;
  
      // Length check
      if (length >= 12) {
        score += 3;
      } else if (length >= 8) {
        score += 2;
      } else if (length >= 6) {
        score += 1;
      }
  
      // Character variety checks
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
      // Final score calculation (0-5 scale)
      score = Math.min(score, 5);
  
      // Generate feedback
      let feedback = '';
      if (score < 2) {
        feedback = 'Weak: Consider a longer password with more variety';
      } else if (score < 4) {
        feedback = 'Moderate: Adding special characters would improve strength';
      } else {
        feedback = 'Strong: Good job!';
      }
  
      return { score, feedback };
    }
  }
  
  // Create global instance
  const passwordGenerator = new PasswordGenerator();