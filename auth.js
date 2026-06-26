import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ── LOGIN ─────────────────────────────────────
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── REGISTER ──────────────────────────────────
export async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

// ── LOGOUT ────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── AUTH STATE LISTENER ───────────────────────
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
