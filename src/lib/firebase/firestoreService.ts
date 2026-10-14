import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { ExtractedNidData, SavedNidRecord } from '@/types/nid';

const LOCAL_STORAGE_KEY = 'bd_nid_saved_records';

/**
 * Saves an extraction record with explicit user consent.
 * Attempts server-side Admin SDK route first, then client Firestore, then local storage.
 */
export async function saveExtractionRecord(
  ownerUid: string,
  fields: ExtractedNidData,
  cardType?: 'smart' | 'old' | 'birth_certificate' | 'unknown' | string
): Promise<SavedNidRecord> {
  if (!ownerUid) {
    throw new Error('User must be authenticated to save extraction records.');
  }

  // 1. Try server-side Admin SDK route
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerUid, fields, cardType }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        // Also sync local cache for quick offline review
        const local = getLocalRecords();
        local.unshift(data.record);
        setLocalRecords(local);
        return data.record;
      }
    }
  } catch {
    // Fallback to client SDK or local
  }

  // 2. Client Firestore SDK
  const now = new Date().toISOString();
  const newRecord: Omit<SavedNidRecord, 'id'> = {
    ownerUid,
    extractedFields: fields,
    createdAt: now,
    updatedAt: now,
    cardType: (cardType || 'unknown') as 'smart' | 'old' | 'birth_certificate' | 'unknown',
  };

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'extractionRecords');
      const docRef = await addDoc(colRef, newRecord);
      const saved: SavedNidRecord = { id: docRef.id, ...newRecord };
      const local = getLocalRecords();
      local.unshift(saved);
      setLocalRecords(local);
      return saved;
    } catch (err) {
      console.warn('Client Firestore write warning:', err);
    }
  }

  // 3. Local fallback persistence
  const id = `local_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recordWithId: SavedNidRecord = { id, ...newRecord };
  const existing = getLocalRecords();
  existing.unshift(recordWithId);
  setLocalRecords(existing);
  return recordWithId;
}

/**
 * Fetches all saved records owned by the current authenticated user.
 */
export async function getUserExtractionRecords(ownerUid: string): Promise<SavedNidRecord[]> {
  if (!ownerUid) return [];

  // 1. Try server-side Admin route
  try {
    const res = await fetch(`/api/records?ownerUid=${encodeURIComponent(ownerUid)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        return data.records;
      }
    }
  } catch {
    // Fallback to client Firestore
  }

  // 2. Client Firestore SDK
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'extractionRecords');
      const q = query(
        colRef,
        where('ownerUid', '==', ownerUid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const records: SavedNidRecord[] = [];
      snapshot.forEach((docSnapshot) => {
        records.push({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<SavedNidRecord, 'id'>),
        });
      });
      return records;
    } catch (err) {
      console.warn('Firestore fetch fallback:', err);
    }
  }

  // 3. Local storage fallback
  const records = getLocalRecords();
  return records.filter((r) => r.ownerUid === ownerUid);
}

/**
 * Deletes a single extraction record owned by the user.
 */
export async function deleteExtractionRecord(recordId: string, ownerUid: string): Promise<boolean> {
  if (!recordId || !ownerUid) return false;

  // 1. Try server-side Admin route
  try {
    const res = await fetch(
      `/api/records?recordId=${encodeURIComponent(recordId)}&ownerUid=${encodeURIComponent(ownerUid)}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const records = getLocalRecords();
        setLocalRecords(records.filter((r) => !(r.id === recordId && r.ownerUid === ownerUid)));
        return true;
      }
    }
  } catch {
    // Fallback below
  }

  // 2. Client Firestore SDK
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'extractionRecords', recordId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting from Firestore:', err);
    }
  }

  const records = getLocalRecords();
  const filtered = records.filter((r) => !(r.id === recordId && r.ownerUid === ownerUid));
  setLocalRecords(filtered);
  return true;
}

/**
 * Deletes all saved extraction records owned by the current user.
 */
export async function deleteAllUserRecords(ownerUid: string): Promise<boolean> {
  if (!ownerUid) return false;

  // 1. Try server-side Admin route
  try {
    const res = await fetch(
      `/api/records?all=true&ownerUid=${encodeURIComponent(ownerUid)}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const records = getLocalRecords();
        setLocalRecords(records.filter((r) => r.ownerUid !== ownerUid));
        return true;
      }
    }
  } catch {
    // Fallback
  }

  const records = getLocalRecords();
  const remaining = records.filter((r) => r.ownerUid !== ownerUid);
  setLocalRecords(remaining);
  return true;
}

// Local storage helpers
function getLocalRecords(): SavedNidRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalRecords(records: SavedNidRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}
