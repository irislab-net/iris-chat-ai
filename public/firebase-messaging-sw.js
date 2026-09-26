/**
 * Firebase Cloud Messaging background handler (site-root scope).
 * Uses same-origin compat builds so CSP / gstatic fetch cannot break registration.
 */
importScripts("/firebase-sw/firebase-app-compat.js")
importScripts("/firebase-sw/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyDi4byocMKJ9oklAk4RdK_2CB6446NNy0w",
  authDomain: "exur-main.firebaseapp.com",
  projectId: "exur-main",
  storageBucket: "exur-main.firebasestorage.app",
  messagingSenderId: "604582580021",
  appId: "1:604582580021:web:18e1fc01b3832baf36867c",
  measurementId: "G-RBYHCFCEE5",
})

firebase.messaging()
