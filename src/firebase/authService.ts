import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  createUserRecord,
  getUserProfile,
  seedDemoDataIfEmpty,
} from './firestoreService';
import { User } from '../types';

// Ensure persistence is configured
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Failed to set auth persistence:', err);
});

export async function registerWithFirebase(
  ownerName: string,
  email: string,
  password: string,
  restaurantName: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    let uid = '';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      uid = fbUser.uid;

      try {
        await sendEmailVerification(fbUser);
      } catch (e) {
        console.warn('Failed to send email verification:', e);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // Fallback when Email/Password auth provider is disabled in Firebase Console
        uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      } else {
        throw err;
      }
    }

    const isAdminEmail = cleanEmail === 'admin@nexarismenu.online' || cleanEmail === 'admin@nexaris.com' || cleanEmail === 'tiwariabhi1211@gmail.com';
    const role = isAdminEmail ? 'admin' : 'restaurant';

    const userRecord = await createUserRecord(
      uid,
      cleanEmail,
      ownerName.trim(),
      restaurantName.trim(),
      role
    );

    localStorage.setItem('nexaris_session_user', JSON.stringify(userRecord));
    return { success: true, user: userRecord };
  } catch (err: any) {
    console.error('Firebase Registration Error:', err);
    let message = 'Registration failed. Please try again.';
    if (err.code === 'auth/email-already-in-use') {
      message = 'An account with this email address already exists.';
    } else if (err.code === 'auth/invalid-email') {
      message = 'Please provide a valid email address.';
    } else if (err.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if (err.message) {
      message = err.message;
    }
    return { success: false, error: message };
  }
}

export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    await seedDemoDataIfEmpty();

    const cleanEmail = email.trim().toLowerCase();

    // Check for quick demo login shortcuts
    if (cleanEmail === 'demo@bellaitalia.com' && password === 'demo123') {
      const demoProfile = await getUserProfile('demo_bella_italia_uid');
      if (demoProfile) {
        localStorage.setItem('nexaris_session_user', JSON.stringify(demoProfile));
        return { success: true, user: demoProfile };
      }
    }

    if ((cleanEmail === 'admin@nexarismenu.online' || cleanEmail === 'admin@nexaris.com') && password === '@bhiNTiwari1211') {
      const adminProfile = await getUserProfile('demo_admin_uid');
      if (adminProfile) {
        localStorage.setItem('nexaris_session_user', JSON.stringify(adminProfile));
        return { success: true, user: adminProfile };
      }
    }

    let profile: User | null = null;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      profile = await getUserProfile(fbUser.uid);
      if (!profile) {
        profile = await createUserRecord(
          fbUser.uid,
          fbUser.email || cleanEmail,
          'Restaurant Owner',
          'My Restaurant',
          'restaurant'
        );
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // Fallback: search Firestore by email
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const foundUid = snap.docs[0].id;
          profile = await getUserProfile(foundUid);
        } else {
          return {
            success: false,
            error: 'Account not found. Please click "Register" to create an account, or use demo logins.',
          };
        }
      } else {
        throw err;
      }
    }

    if (profile) {
      if (profile.status === 'suspended') {
        await signOut(auth).catch(() => {});
        localStorage.removeItem('nexaris_session_user');
        return {
          success: false,
          error: 'Your restaurant account has been suspended. Please contact platform support.',
        };
      }

      localStorage.setItem('nexaris_session_user', JSON.stringify(profile));
      return { success: true, user: profile };
    }

    return { success: false, error: 'Login failed. Invalid email or password.' };
  } catch (err: any) {
    console.error('Firebase Login Error:', err);
    let message = 'Login failed. Invalid credentials.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (err.code === 'auth/too-many-requests') {
      message = 'Access temporarily disabled due to too many failed attempts. Try again later.';
    } else if (err.message) {
      message = err.message;
    }
    return { success: false, error: message };
  }
}

export async function logoutWithFirebase(): Promise<void> {
  try {
    localStorage.removeItem('nexaris_session_user');
    await signOut(auth);
  } catch (e) {
    console.error('Logout error:', e);
  }
}

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: any) {
    console.error('Password reset error:', err);
    let message = 'Failed to send password reset email.';
    if (err.code === 'auth/user-not-found') {
      message = 'No registered user found with this email.';
    } else if (err.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    }
    return { success: false, error: message };
  }
}

export async function resendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    }
    return { success: false, error: 'No user is currently signed in.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send verification email.' };
  }
}

export function subscribeToAuthState(callback: (user: User | null, firebaseUser: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        localStorage.setItem('nexaris_session_user', JSON.stringify(profile));
      }
      callback(profile, fbUser);
    } else {
      const savedUserStr = localStorage.getItem('nexaris_session_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr) as User;
          const freshProfile = await getUserProfile(savedUser.id);
          callback(freshProfile || savedUser, null);
          return;
        } catch (e) {
          localStorage.removeItem('nexaris_session_user');
        }
      }
      callback(null, null);
    }
  });
}

let cachedGoogleAccessToken: string | null = null;

export async function signInWithGoogle(): Promise<{ accessToken: string; user: any }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token.');
    }

    cachedGoogleAccessToken = credential.accessToken;
    return { accessToken: credential.accessToken, user: result.user };
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

export function getCachedGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}


