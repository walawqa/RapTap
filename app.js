/* ================= Firebase imports ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ================= PWA ================= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

/* ================= Firebase config ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCoyWn1mFTGPj8TK8WoBHNZKRjAZO84rls",
  authDomain: "myapp-ad93b.firebaseapp.com",
  projectId: "myapp-ad93b",
  storageBucket: "myapp-ad93b.firebasestorage.app",
  messagingSenderId: "226529428814",
  appId: "1:226529428814:web:67760d1142d4ae0cf20a1f"
};

/* ================= Firebase init ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= UI refs ================= */
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnGoogle = document.getElementById("btnGoogle");
const authMsg = document.getElementById("authMsg");

const userBadge = document.getElementById("userBadge");
const btnLogout = document.getElementById("btnLogout");

const btnNew = document.getElementById("btnNew");
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

const titleEl = document.getElementById("title");
const bodyEl = document.getElementById("body");
const statsEl = document.getElementById("stats");
const saveStateEl = document.getElementById("saveState");

/* ================= State ================= */
let currentUser = null;
let currentDocId = null;
let unsub = null;
let saveTimer = null;

/* ================= Helpers ================= */
function showMsg(text, type = "info") {
  authMsg.classList.remove("hidden");
  authMsg.textContent = text;
  authMsg.style.borderColor = type === "err" ? "#ef444433" : "var(--stroke)";
}

function setView(isAuthed) {
  authView.classList.toggle("hidden", isAuthed);
  appView.classList.toggle("hidden", !isAuthed);
  userBadge.classList.toggle("hidden", !isAuthed);
  btnLogout.classList.toggle("hidden", !isAuthed);
}

/* ================= Auth ================= */
btnRegister.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value);
  } catch (e) {
    showMsg(e.message, "err");
  }
});

btnLogin.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
  } catch (e) {
    showMsg(e.message, "err");
  }
});

btnGoogle.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch {
    await signInWithRedirect(auth, provider);
  }
});

btnLogout.addEventListener("click", () => signOut(auth));
getRedirectResult(auth).catch(() => {});

/* ================= Firestore ================= */
function listenTexts(uid) {
  if (unsub) unsub();

  const q = query(
    collection(db, "rapTexts"),
    where("uid", "==", uid),
    orderBy("updatedAt", "desc")
  );

  unsub = onSnapshot(q, snap => {
    listEl.innerHTML = "";
    snap.forEach(docu => {
      const d = docu.data();
      const el = document.createElement("div");
      el.className = "item";
      el.textContent = d.title || "Bez tytułu";
      el.onclick = () => openDoc(docu.id, d);
      listEl.appendChild(el);
    });
  });
}

function openDoc(id, d) {
  currentDocId = id;
  titleEl.value = d.title || "";
  bodyEl.value = d.body || "";
}

btnNew.addEventListener("click", async () => {
  const ref = await addDoc(collection(db, "rapTexts"), {
    uid: currentUser.uid,
    title: "Nowy tekst",
    body: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  currentDocId = ref.id;
});

function saveDebounced() {
  if (!currentDocId) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await updateDoc(doc(db, "rapTexts", currentDocId), {
      title: titleEl.value,
      body: bodyEl.value,
      updatedAt: serverTimestamp()
    });
    saveStateEl.textContent = "Zapisano ✅";
  }, 400);
}

titleEl.addEventListener("input", saveDebounced);
bodyEl.addEventListener("input", saveDebounced);

/* ================= Auth state ================= */
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    setView(true);
    userBadge.textContent = user.email || "Zalogowano";
    listenTexts(user.uid);
  } else {
    setView(false);
  }
});
