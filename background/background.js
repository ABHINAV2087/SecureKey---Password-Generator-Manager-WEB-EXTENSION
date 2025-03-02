// Background script for Password Manager extension

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log('Password Manager Extension installed');
    
    // Initialize the storage structure if needed
    chrome.storage.local.get(['users', 'passwordData'], (result) => {
      if (!result.users) {
        chrome.storage.local.set({ users: {} });
      }
      
      if (!result.passwordData) {
        chrome.storage.local.set({ passwordData: {} });
      }
    });
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkLogin') {
      chrome.storage.local.get(['currentUser', 'isLoggedIn'], (result) => {
        sendResponse({
          isLoggedIn: !!result.isLoggedIn,
          user: result.currentUser
        });
      });
      return true; // Required for async response
    }
  });
  
  // Optional: Add context menu for generating passwords
  chrome.contextMenus?.create({
    id: 'generatePassword',
    title: 'Generate Password',
    contexts: ['editable']
  });
  
  // Optional: Handle context menu clicks
  chrome.contextMenus?.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'generatePassword') {
      // Generate a password and insert it at cursor position
      const password = generateRandomPassword();
      
      chrome.tabs.executeScript(tab.id, {
        code: `
          (function() {
            const activeElement = document.activeElement;
            if (activeElement.isContentEditable || 
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA') {
              
              // Set the value or insert at cursor
              if (activeElement.isContentEditable) {
                document.execCommand('insertText', false, '${password}');
              } else {
                activeElement.value = '${password}';
              }
            }
          })();
        `
      });
    }
  });
  
  // Simple random password generator for context menu
  function generateRandomPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }