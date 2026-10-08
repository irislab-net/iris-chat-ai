import type { FirebaseOptions } from "firebase/app"
import {
  AFFILIATE_FIRESTORE_ADDRESS_FORMAT,
  AFFILIATE_FIRESTORE_DATABASE_ID,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from "@/config/env"

export function getAffiliateFirebaseWebConfig(): FirebaseOptions {
  return {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    appId: FIREBASE_APP_ID,
    ...(FIREBASE_STORAGE_BUCKET ? { storageBucket: FIREBASE_STORAGE_BUCKET } : {}),
    ...(FIREBASE_MESSAGING_SENDER_ID
      ? { messagingSenderId: FIREBASE_MESSAGING_SENDER_ID }
      : {}),
    ...(FIREBASE_MEASUREMENT_ID ? { measurementId: FIREBASE_MEASUREMENT_ID } : {}),
  }
}

export function getAffiliateFirestoreDatabaseId(): string | null {
  return AFFILIATE_FIRESTORE_DATABASE_ID
}

export type AffiliateFirestoreAddressFormat = "lowercase" | "checksum"

export function getAffiliateFirestoreAddressFormat(): AffiliateFirestoreAddressFormat | null {
  return AFFILIATE_FIRESTORE_ADDRESS_FORMAT
}
