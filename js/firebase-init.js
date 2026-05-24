/* ============================================================
   firebase-init.js — Firebase Auth + Firestore wiring.
   ------------------------------------------------------------
   הוראות הפעלה (חד־פעמי, ~5 דקות):
   1. כנסי ל-https://console.firebase.google.com/  → "Add project".
   2. בפרויקט: Build → Authentication → Get started →
        אפשרי "Email/Password".
   3. Build → Firestore Database → Create database → Production mode.
   4. Project settings (גלגל שיניים) → General → "Your apps" →
        Web (</>) → קבלי את אובייקט הקונפיג והדביקי אותו ב-FIREBASE_CONFIG
        במקום ה-placeholder למטה.
   5. עדכני את TEACHER_EMAILS למייל שלך (וכל מורה נוסף).
   6. ב-Firestore Rules הדביקי:
        rules_version = '2';
        service cloud.firestore {
          match /databases/{db}/documents {
            match /users/{uid} {
              allow read, write: if request.auth != null && request.auth.uid == uid;
              allow read: if request.auth != null
                && request.auth.token.email in ['gal@example.com'];
            }
          }
        }
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAmz_p0EOrZeKSrxn87wVfsd_5YUXJcUJA",
  authDomain:        "nocomplex-cafb7.firebaseapp.com",
  projectId:         "nocomplex-cafb7",
  storageBucket:     "nocomplex-cafb7.firebasestorage.app",
  messagingSenderId: "112889836536",
  appId:             "1:112889836536:web:1d2aae63e263262ca59c0d",
  measurementId:     "G-QVD7SER9KV",
};

// רשימת מיילים שמקבלים גישת מורה (גם אם נרשמו רגיל). הוסיפי כאן את שלך:
const TEACHER_EMAILS = [
  "galerez2522@gmail.com",
];

const Cloud = (() => {
  let enabled = false;
  let auth = null, db = null;

  function init() {
    const configured = !FIREBASE_CONFIG.apiKey.startsWith("PASTE_");
    if (!configured) {
      console.info("[Cloud] Firebase config not set — running in local-only mode. ראי js/firebase-init.js להוראות הפעלה.");
      return false;
    }
    if (typeof firebase === "undefined") {
      console.warn("[Cloud] Firebase SDK לא נטען.");
      return false;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db   = firebase.firestore();
      enabled = true;
      return true;
    } catch (e) {
      console.warn("[Cloud] init failed:", e);
      return false;
    }
  }

  function isEnabled() { return enabled; }
  function isTeacherEmail(email) {
    return !!email && TEACHER_EMAILS.map(s => s.toLowerCase()).includes(email.toLowerCase());
  }

  // -------- Auth --------
  async function signUp(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      try { await cred.user.updateProfile({ displayName }); } catch {}
    }
    const role = isTeacherEmail(email) ? "teacher" : "student";
    await db.collection("users").doc(cred.user.uid).set({
      name:  displayName || email.split("@")[0],
      email: email.toLowerCase(),
      role,
      progress: DEFAULT_PROGRESS(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function signOutUser() {
    if (!auth) return;
    try { await auth.signOut(); } catch {}
  }

  function onAuthChange(cb) {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(cb);
  }

  // -------- Firestore: progress sync --------
  async function loadUserDoc(uid) {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    return snap.data();
  }

  async function ensureUserDoc(user) {
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      const email = (user.email || "").toLowerCase();
      const role  = isTeacherEmail(email) ? "teacher" : "student";
      await ref.set({
        name:  user.displayName || email.split("@")[0] || "תלמיד/ה",
        email,
        role,
        progress: DEFAULT_PROGRESS(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return (await ref.get()).data();
    }
    // refresh role from allowlist on each login (in case email was added later)
    const email = (snap.data().email || user.email || "").toLowerCase();
    const desiredRole = isTeacherEmail(email) ? "teacher" : "student";
    if (snap.data().role !== desiredRole) {
      await ref.update({ role: desiredRole });
    }
    return (await ref.get()).data();
  }

  // throttled save
  let saveTimer = null;
  function queueProgressSave(uid, progress) {
    if (!enabled || !uid) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      db.collection("users").doc(uid).set({
        progress,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch(e => console.warn("[Cloud] save failed", e));
    }, 600);
  }

  async function fetchAllStudents() {
    const snap = await db.collection("users").where("role", "==", "student").get();
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  return {
    init, isEnabled, isTeacherEmail,
    signUp, signIn, signOutUser, onAuthChange,
    loadUserDoc, ensureUserDoc, queueProgressSave, fetchAllStudents,
  };
})();
