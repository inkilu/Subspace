import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignIn, 
  createUserWithEmailAndPassword as realCreateUser, 
  signOut as realSignOut, 
  onAuthStateChanged as realOnAuthChanged,
  signInAnonymously as realSignInAnon
} from 'firebase/auth';
import { 
  initializeFirestore, 
  collection as realCollection, 
  doc as realDoc, 
  getDocs as realGetDocs, 
  addDoc as realAddDoc, 
  updateDoc as realUpdateDoc, 
  deleteDoc as realDeleteDoc,
  query as realQuery,
  where as realWhere
} from 'firebase/firestore';

// Environment variables check (Vite style)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY');

let auth;
let db;
let useMock = !isConfigured;

if (!useMock) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Force HTTP long-polling to prevent WebSocket/streaming block loop
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
    console.log("🔥 Real Firebase initialized successfully (HTTP Long-Polling forced)!");
  } catch (error) {
    console.error("Failed to initialize real Firebase, switching to Mock:", error);
    useMock = true;
  }
}

if (useMock) {
  console.warn("⚠️ Firebase configuration missing or invalid. Using LocalStorage Mock Service.");
}

// ==========================================
// LOCAL STORAGE MOCK IMPLEMENTATION
// ==========================================

// Mock State
const mockState = {
  users: JSON.parse(localStorage.getItem('subspace_mock_users') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('subspace_mock_current_user') || 'null'),
  subscriptions: JSON.parse(localStorage.getItem('subspace_mock_subscriptions') || '[]'),
  authListeners: []
};

// Sync Helpers
const saveUsers = () => localStorage.setItem('subspace_mock_users', JSON.stringify(mockState.users));
const saveCurrentUser = () => localStorage.setItem('subspace_mock_current_user', JSON.stringify(mockState.currentUser));
const saveSubscriptions = () => localStorage.setItem('subspace_mock_subscriptions', JSON.stringify(mockState.subscriptions));

const notifyAuthListeners = () => {
  mockState.authListeners.forEach(cb => cb(mockState.currentUser));
};

// Mock Authentication Exported API
export const authService = {
  signInAnonymously: async (currency = 'USD') => {
    if (!useMock) {
      const userCred = await realSignInAnon(auth);
      // Save profile configuration to Firestore
      try {
        await realAddDoc(realCollection(db, 'users'), {
          uid: userCred.user.uid,
          currency: currency,
          budgetLimit: 250
        });
      } catch (err) {
        console.error("Failed to save guest profile in Firestore:", err);
      }
      return userCred;
    }
    
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substr(2, 9),
      email: 'guest@subspace.local',
      isAnonymous: true,
      displayName: 'Guest User',
      currency: currency,
      budgetLimit: 250
    };
    mockState.currentUser = guestUser;
    saveCurrentUser();
    notifyAuthListeners();
    return { user: guestUser };
  },

  createUserWithEmailAndPassword: async (email, password, currency = 'USD') => {
    if (!useMock) {
      const userCred = await realCreateUser(auth, email, password);
      // Save profile configuration to Firestore
      try {
        await realAddDoc(realCollection(db, 'users'), {
          uid: userCred.user.uid,
          currency: currency,
          budgetLimit: 250
        });
      } catch (err) {
        console.error("Failed to save registered profile in Firestore:", err);
      }
      return userCred;
    }
    
    // Check if user exists
    const exists = mockState.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('auth/email-already-in-use');
    }
    
    const newUser = {
      uid: 'uid_' + Math.random().toString(36).substr(2, 9),
      email: email,
      isAnonymous: false,
      displayName: email.split('@')[0],
      currency: currency,
      budgetLimit: 250
    };
    
    mockState.users.push({ ...newUser, password }); // In mock we store password simply
    saveUsers();
    
    mockState.currentUser = newUser;
    saveCurrentUser();
    notifyAuthListeners();
    return { user: newUser };
  },

  signInWithEmailAndPassword: async (email, password) => {
    if (!useMock) return realSignIn(auth, email, password);
    
    const userMatch = mockState.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (!userMatch) {
      throw new Error('auth/wrong-password-or-user-not-found');
    }
    
    const userObj = {
      uid: userMatch.uid,
      email: userMatch.email,
      isAnonymous: false,
      displayName: userMatch.displayName,
      currency: userMatch.currency || 'USD',
      budgetLimit: userMatch.budgetLimit !== undefined ? userMatch.budgetLimit : 250
    };
    
    mockState.currentUser = userObj;
    saveCurrentUser();
    notifyAuthListeners();
    return { user: userObj };
  },

  signOut: async () => {
    try {
      if (!useMock && auth) {
        await realSignOut(auth);
      }
    } catch (e) {
      console.error("Firebase SignOut error:", e);
    }
    
    // Clear localStorage & sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    if (useMock) {
      mockState.currentUser = null;
      notifyAuthListeners();
    } else {
      window.location.reload(); // Force reload to clear in-memory credentials and caches
    }
  },

  onAuthStateChanged: (callback) => {
    if (!useMock) {
      return realOnAuthChanged(auth, (currentUser) => {
        if (currentUser) {
          // Immediately set login state so dashboard opens
          callback(currentUser);
          
          // Load profile settings asynchronously in the background
          const loadUserProfile = async () => {
            try {
              const q = realQuery(realCollection(db, 'users'), realWhere('uid', '==', currentUser.uid));
              const snap = await realGetDocs(q);
              let currency = 'USD';
              let budgetLimit = 250;
              snap.forEach((doc) => {
                const data = doc.data();
                currency = data.currency || 'USD';
                budgetLimit = data.budgetLimit !== undefined ? data.budgetLimit : 250;
              });
              currentUser.currency = currency;
              currentUser.budgetLimit = budgetLimit;
              // Notify state of updated user profile data
              callback({ ...currentUser });
            } catch (err) {
              console.error("Failed to load user profile from Firestore:", err);
            }
          };
          loadUserProfile();
          return;
        }
        callback(currentUser);
      });
    }
    
    mockState.authListeners.push(callback);
    // Initial call
    callback(mockState.currentUser);
    
    // Return unsubscribe function
    return () => {
      mockState.authListeners = mockState.authListeners.filter(cb => cb !== callback);
    };
  },

  updateUserProfile: async (uid, data) => {
    if (!useMock) {
      try {
        const q = realQuery(realCollection(db, 'users'), realWhere('uid', '==', uid));
        const snap = await realGetDocs(q);
        snap.forEach(async (document) => {
          await realUpdateDoc(realDoc(db, 'users', document.id), data);
        });
      } catch (err) {
        console.error("Failed to update user profile in Firestore:", err);
      }
      return;
    }
    
    if (mockState.currentUser && mockState.currentUser.uid === uid) {
      mockState.currentUser = { ...mockState.currentUser, ...data };
      saveCurrentUser();
      
      const uIndex = mockState.users.findIndex(u => u.uid === uid);
      if (uIndex !== -1) {
        mockState.users[uIndex] = { ...mockState.users[uIndex], ...data };
        saveUsers();
      }
      notifyAuthListeners();
    }
  }
};

// Mock Firestore Database Exported API
export const databaseService = {
  getSubscriptions: async (userId) => {
    if (!useMock) {
      const q = realQuery(realCollection(db, 'subscriptions'), realWhere('userId', '==', userId));
      const querySnapshot = await realGetDocs(q);
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      return subs;
    }
    
    // Return mock filtered by userId
    return mockState.subscriptions.filter(sub => sub.userId === userId);
  },

  addSubscription: async (subscriptionData) => {
    if (!useMock) {
      const docRef = await realAddDoc(realCollection(db, 'subscriptions'), subscriptionData);
      return docRef.id;
    }
    
    const id = 'sub_' + Math.random().toString(36).substr(2, 9);
    const newSub = {
      id,
      ...subscriptionData,
      createdAt: new Date().toISOString()
    };
    
    mockState.subscriptions.push(newSub);
    saveSubscriptions();
    return id;
  },

  updateSubscription: async (id, subscriptionData) => {
    if (!useMock) {
      const docRef = realDoc(db, 'subscriptions', id);
      await realUpdateDoc(docRef, subscriptionData);
      return;
    }
    
    mockState.subscriptions = mockState.subscriptions.map(sub => {
      if (sub.id === id) {
        return { ...sub, ...subscriptionData, updatedAt: new Date().toISOString() };
      }
      return sub;
    });
    saveSubscriptions();
  },

  deleteSubscription: async (id) => {
    if (!useMock) {
      const docRef = realDoc(db, 'subscriptions', id);
      await realDeleteDoc(docRef);
      return;
    }
    
    mockState.subscriptions = mockState.subscriptions.filter(sub => sub.id !== id);
    saveSubscriptions();
  }
};

// Export actual objects just in case direct usage is required
export { auth, db, useMock };
export default { authService, databaseService, useMock };
