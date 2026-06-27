import {
  getFirestore,
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./auth.js";

export const db = getFirestore(app);

// ── HELPERS ───────────────────────────────────
const col = (uid, name) => collection(db, "users", uid, name);
const ref = (uid, name, id) => doc(db, "users", uid, name, id);

// ── TASKS ─────────────────────────────────────
export async function addTask(uid, data) {
  return addDoc(col(uid, "tasks"), { ...data, createdAt: serverTimestamp() });
}
export async function updateTask(uid, id, data) {
  return updateDoc(ref(uid, "tasks", id), data);
}
export async function deleteTask(uid, id) {
  return deleteDoc(ref(uid, "tasks", id));
}
export function listenTasks(uid, callback) {
  return onSnapshot(query(col(uid, "tasks"), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── HABITS ────────────────────────────────────
export async function addHabit(uid, data) {
  return addDoc(col(uid, "habits"), { ...data, createdAt: serverTimestamp() });
}
export async function updateHabit(uid, id, data) {
  return updateDoc(ref(uid, "habits", id), data);
}
export async function deleteHabit(uid, id) {
  return deleteDoc(ref(uid, "habits", id));
}
export function listenHabits(uid, callback) {
  return onSnapshot(query(col(uid, "habits"), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── HABIT LOGS ────────────────────────────────
// stored as: users/{uid}/habitLogs/{habitId_date}
export async function toggleHabitLog(uid, habitId, date, current) {
  const id = `${habitId}_${date}`;
  const r  = ref(uid, "habitLogs", id);
  if (current) {
    return deleteDoc(r);
  } else {
    return setDoc(r, { habitId, date, done: true });
  }
}
export function listenHabitLogs(uid, callback) {
  return onSnapshot(col(uid, "habitLogs"), snap => {
    const logs = {};
    snap.docs.forEach(d => {
      const { habitId, date } = d.data();
      if (!logs[habitId]) logs[habitId] = {};
      logs[habitId][date] = true;
    });
    callback(logs);
  });
}

// ── DELEGATIONS ───────────────────────────────
export async function addDelegation(uid, data) {
  return addDoc(col(uid, "delegations"), { ...data, createdAt: serverTimestamp() });
}
export async function updateDelegation(uid, id, data) {
  return updateDoc(ref(uid, "delegations", id), data);
}
export async function deleteDelegation(uid, id) {
  return deleteDoc(ref(uid, "delegations", id));
}
export function listenDelegations(uid, callback) {
  return onSnapshot(query(col(uid, "delegations"), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── NOTES ─────────────────────────────────────
export async function addNote(uid, data) {
  return addDoc(col(uid, "notes"), { ...data, createdAt: serverTimestamp() });
}
export async function updateNote(uid, id, data) {
  return updateDoc(ref(uid, "notes", id), data);
}
export async function deleteNote(uid, id) {
  return deleteDoc(ref(uid, "notes", id));
}
export function listenNotes(uid, callback) {
  return onSnapshot(query(col(uid, "notes"), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── REVIEWS ───────────────────────────────────
export async function saveReview(uid, date, key, value) {
  const r = ref(uid, "reviews", date);
  return setDoc(r, { [key]: value }, { merge: true });
}
export function listenReviews(uid, callback) {
  return onSnapshot(col(uid, "reviews"), snap => {
    const reviews = {};
    snap.docs.forEach(d => { reviews[d.id] = d.data(); });
    callback(reviews);
  });
}

// ── RETRO DOCS (multiple retros with history) ────
export async function saveRetroDoc(uid, id, data) {
  const r = ref(uid, "retros", id);
  return setDoc(r, data, { merge: true });
}
export function listenRetros(uid, callback) {
  return onSnapshot(col(uid, "retros"), snap => {
    const retros = {};
    snap.docs.forEach(d => { retros[d.id] = d.data(); });
    callback(retros);
  });
}
// ── REMINDERS ─────────────────────────────────
export async function saveReminder(uid, id, data) {
  const r = ref(uid, "reminders", id);
  return setDoc(r, data, { merge: true });
}
export async function deleteReminder(uid, id) {
  return deleteDoc(ref(uid, "reminders", id));
}
export function listenReminders(uid, callback) {
  return onSnapshot(col(uid, "reminders"), snap => {
    const reminders = {};
    snap.docs.forEach(d => { reminders[d.id] = { id: d.id, ...d.data() }; });
    callback(reminders);
  });
}
// ── SUBTASKS ──────────────────────────────────
// Structure: tasks/{taskId}/subtasks/{subtaskId}/subsubtasks/{subId}

export async function addSubtask(uid, parentId, data) {
  const c = collection(db, "users", uid, "tasks", parentId, "subtasks");
  return addDoc(c, { ...data, createdAt: serverTimestamp() });
}
export async function updateSubtask(uid, parentId, subtaskId, data) {
  return updateDoc(doc(db, "users", uid, "tasks", parentId, "subtasks", subtaskId), data);
}
export async function deleteSubtask(uid, parentId, subtaskId) {
  return deleteDoc(doc(db, "users", uid, "tasks", parentId, "subtasks", subtaskId));
}
export function listenSubtasks(uid, parentId, callback) {
  const c = collection(db, "users", uid, "tasks", parentId, "subtasks");
  return onSnapshot(query(c, orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Sub-subtasks (level 3)
export async function addSubSubtask(uid, parentId, subtaskId, data) {
  const c = collection(db, "users", uid, "tasks", parentId, "subtasks", subtaskId, "items");
  return addDoc(c, { ...data, createdAt: serverTimestamp() });
}
export async function updateSubSubtask(uid, parentId, subtaskId, itemId, data) {
  return updateDoc(doc(db, "users", uid, "tasks", parentId, "subtasks", subtaskId, "items", itemId), data);
}
export async function deleteSubSubtask(uid, parentId, subtaskId, itemId) {
  return deleteDoc(doc(db, "users", uid, "tasks", parentId, "subtasks", subtaskId, "items", itemId));
}
export function listenSubSubtasks(uid, parentId, subtaskId, callback) {
  const c = collection(db, "users", uid, "tasks", parentId, "subtasks", subtaskId, "items");
  return onSnapshot(query(c, orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
// ── S-CURVE ───────────────────────────────────
export async function saveSCurveProject(uid, id, data) {
  const r = doc(db, "users", uid, "scurve", id);
  return setDoc(r, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
export async function deleteSCurveProject(uid, id) {
  return deleteDoc(doc(db, "users", uid, "scurve", id));
}
export function listenSCurveProjects(uid, callback) {
  return onSnapshot(
    query(collection(db, "users", uid, "scurve"), orderBy("updatedAt", "desc")),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}
export async function saveSCurveItem(uid, projectId, itemId, data) {
  const r = doc(db, "users", uid, "scurve", projectId, "items", itemId);
  return setDoc(r, data, { merge: true });
}
export async function deleteSCurveItem(uid, projectId, itemId) {
  return deleteDoc(doc(db, "users", uid, "scurve", projectId, "items", itemId));
}
export function listenSCurveItems(uid, projectId, callback) {
  return onSnapshot(
    query(collection(db, "users", uid, "scurve", projectId, "items"), orderBy("createdAt", "asc")),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}
export async function saveSCurveActual(uid, projectId, dateKey, data) {
  // dateKey = "2025-W26" or "2025-06"
  const r = doc(db, "users", uid, "scurve", projectId, "actuals", dateKey);
  return setDoc(r, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
export function listenSCurveActuals(uid, projectId, callback) {
  return onSnapshot(
    collection(db, "users", uid, "scurve", projectId, "actuals"),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}
// ── PER-ITEM ACTUALS ──────────────────────────
// Store: users/{uid}/scurve/{projId}/itemActuals/{dateStr_itemId}
export async function saveItemActual(uid, projId, dateStr, itemId, pct) {
  const docId = `${dateStr}_${itemId}`;
  return setDoc(
    doc(db, "users", uid, "scurve", projId, "itemActuals", docId),
    { dateStr, itemId, pct, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
export function listenItemActuals(uid, projId, callback) {
  return onSnapshot(
    collection(db, "users", uid, "scurve", projId, "itemActuals"),
    snap => {
      // Return as { "2026-06-25": { "sci_1_1": 100, "sci_2_1": 50, ... }, ... }
      const result = {};
      snap.docs.forEach(d => {
        const { dateStr, itemId, pct } = d.data();
        if (!result[dateStr]) result[dateStr] = {};
        result[dateStr][itemId] = pct;
      });
      callback(result);
    }
  );
}
