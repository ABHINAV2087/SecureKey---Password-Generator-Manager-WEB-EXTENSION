class AuthManager {
    constructor() {
      this.currentUser = null;
      this.isLoggedIn = false;
    }
  
    // Check if a user is currently logged in
    async checkLoggedIn() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['currentUser', 'isLoggedIn'], (result) => {
          if (result.isLoggedIn && result.currentUser) {
            this.currentUser = result.currentUser;
            this.isLoggedIn = true;
            resolve(true);
          } else {
            this.currentUser = null;
            this.isLoggedIn = false;
            resolve(false);
          }
        });
      });
    }
  
    // Hash password for secure storage
    hashPassword(password) {
      return CryptoJS.SHA256(password).toString();
    }
  
    // Derive encryption key from master password
    deriveEncryptionKey(password) {
      return CryptoJS.PBKDF2(password, 'secure-salt', { keySize: 256/32, iterations: 1000 }).toString();
    }
  
    // Register a new user
    async registerUser(email, password) {
      return new Promise((resolve, reject) => {
        // First check if user already exists
        chrome.storage.local.get(['users'], (result) => {
          const users = result.users || {};
          
          if (users[email]) {
            reject('User already exists');
            return;
          }
          
          // Hash the password for storage
          const hashedPassword = this.hashPassword(password);
          const encryptionKey = this.deriveEncryptionKey(password);
          
          // Create new user
          users[email] = {
            email: email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
          };
          
          // Save user to storage
          chrome.storage.local.set({ users: users }, () => {
            this.currentUser = {
              email: email,
              encryptionKey: encryptionKey
            };
            
            this.isLoggedIn = true;
            
            // Save login state
            chrome.storage.local.set({
              currentUser: this.currentUser,
              isLoggedIn: true
            }, () => {
              resolve(this.currentUser);
            });
          });
        });
      });
    }
  
    // Log in a user
    async loginUser(email, password) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(['users'], (result) => {
          const users = result.users || {};
          const user = users[email];
          
          if (!user) {
            reject('User not found');
            return;
          }
          
          // Check if password matches
          const hashedPassword = this.hashPassword(password);
          if (user.password !== hashedPassword) {
            reject('Incorrect password');
            return;
          }
          
          // Generate encryption key
          const encryptionKey = this.deriveEncryptionKey(password);
          
          this.currentUser = {
            email: email,
            encryptionKey: encryptionKey
          };
          
          this.isLoggedIn = true;
          
          // Save login state
          chrome.storage.local.set({
            currentUser: this.currentUser,
            isLoggedIn: true
          }, () => {
            resolve(this.currentUser);
          });
        });
      });
    }
  
    // Log out the current user
    logout() {
      return new Promise((resolve) => {
        this.currentUser = null;
        this.isLoggedIn = false;
        
        chrome.storage.local.set({
          currentUser: null,
          isLoggedIn: false
        }, () => {
          resolve();
        });
      });
    }
  
    // Get current user
    getCurrentUser() {
      return this.currentUser;
    }
  
    // Check if user is logged in
    isUserLoggedIn() {
      return this.isLoggedIn;
    }
  }
  
  // Create global instance
  const authManager = new AuthManager();