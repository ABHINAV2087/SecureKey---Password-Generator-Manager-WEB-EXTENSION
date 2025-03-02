class PasswordStorage {
    constructor() {
      // Initialize with empty passwords
      this.passwords = {};
    }
  
    // Initialize storage for user
    async initialize(userEmail) {
      return new Promise((resolve) => {
        if (!userEmail) {
          resolve(false);
          return;
        }
        
        chrome.storage.local.get(['passwordData'], (result) => {
          const passwordData = result.passwordData || {};
          this.passwords = passwordData[userEmail] || {};
          resolve(true);
        });
      });
    }
  
    // Encrypt data using the user's encryption key
    encryptData(data, encryptionKey) {
      if (!encryptionKey) throw new Error('Encryption key required');
      return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    }
  
    // Decrypt data using the user's encryption key
    decryptData(encryptedData, encryptionKey) {
      if (!encryptionKey) throw new Error('Encryption key required');
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      } catch (error) {
        console.error('Failed to decrypt data:', error);
        return null;
      }
    }
  
    // Save a password entry
    async savePassword(entry, userEmail, encryptionKey) {
      return new Promise((resolve, reject) => {
        if (!userEmail || !encryptionKey) {
          reject('User must be logged in to save passwords');
          return;
        }
        
        const { account, username, password } = entry;
        
        if (!account || !password) {
          reject('Account and password are required');
          return;
        }
        
        // Create unique ID for the entry
        const id = Date.now().toString();
        
        // Encrypt the password
        const encryptedPassword = this.encryptData(password, encryptionKey);
        
        // Create password entry
        const passwordEntry = {
          id,
          account,
          username: username || '',
          password: encryptedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save to local memory
        this.passwords[id] = passwordEntry;
        
        // Save to chrome storage
        chrome.storage.local.get(['passwordData'], (result) => {
          const passwordData = result.passwordData || {};
          passwordData[userEmail] = this.passwords;
          
          chrome.storage.local.set({ passwordData }, () => {
            resolve(passwordEntry);
          });
        });
      });
    }
  
    // Get all passwords for the user
    async getAllPasswords(userEmail, encryptionKey) {
      return new Promise((resolve) => {
        if (!userEmail || !encryptionKey) {
          resolve([]);
          return;
        }
        
        // Get passwords from memory
        const passwordList = Object.values(this.passwords).map(entry => {
          const decrypted = {...entry};
          
          // Decrypt the password
          try {
            decrypted.password = this.decryptData(entry.password, encryptionKey);
          } catch (error) {
            console.error('Failed to decrypt password:', error);
            decrypted.password = '[Decryption failed]';
          }
          
          return decrypted;
        });
        
        resolve(passwordList);
      });
    }
  
    // Delete a password
    async deletePassword(id, userEmail) {
      return new Promise((resolve, reject) => {
        if (!userEmail) {
          reject('User must be logged in to delete passwords');
          return;
        }
        
        if (!this.passwords[id]) {
          reject('Password not found');
          return;
        }
        
        // Delete from memory
        delete this.passwords[id];
        
        // Update storage
        chrome.storage.local.get(['passwordData'], (result) => {
          const passwordData = result.passwordData || {};
          passwordData[userEmail] = this.passwords;
          
          chrome.storage.local.set({ passwordData }, () => {
            resolve(true);
          });
        });
      });
    }
  }
  
  // Create global instance
  const passwordStorage = new PasswordStorage();