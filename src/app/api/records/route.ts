import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { ExtractedNidData, SavedNidRecord } from '@/types/nid';

// GET: Retrieve user extraction records
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerUid = searchParams.get('ownerUid');

    if (!ownerUid) {
      return NextResponse.json(
        { success: false, error: 'Missing ownerUid parameter' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin Firestore is not initialized on server' },
        { status: 503 }
      );
    }

    const snapshot = await adminDb
      .collection('extractionRecords')
      .where('ownerUid', '==', ownerUid)
      .orderBy('createdAt', 'desc')
      .get();

    const records: SavedNidRecord[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      records.push({
        id: doc.id,
        ...(doc.data() as Omit<SavedNidRecord, 'id'>),
      });
    });

    return NextResponse.json({ success: true, records });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Save an extraction record with owner association
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerUid, fields, cardType } = body as {
      ownerUid: string;
      fields: ExtractedNidData;
      cardType?: 'smart' | 'old' | 'unknown';
    };

    if (!ownerUid || !fields) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ownerUid or fields' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin Firestore is not initialized on server' },
        { status: 503 }
      );
    }

    const now = new Date().toISOString();
    const newRecord: Omit<SavedNidRecord, 'id'> = {
      ownerUid,
      extractedFields: fields,
      createdAt: now,
      updatedAt: now,
      cardType: cardType || 'unknown',
    };

    const docRef = await adminDb.collection('extractionRecords').add(newRecord);

    return NextResponse.json({
      success: true,
      record: {
        id: docRef.id,
        ...newRecord,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Delete single record or all records owned by user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');
    const ownerUid = searchParams.get('ownerUid');
    const deleteAll = searchParams.get('all') === 'true';

    if (!ownerUid) {
      return NextResponse.json(
        { success: false, error: 'Missing ownerUid parameter' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin Firestore is not initialized on server' },
        { status: 503 }
      );
    }

    if (deleteAll) {
      // Bulk delete all records owned by user
      const snapshot = await adminDb
        .collection('extractionRecords')
        .where('ownerUid', '==', ownerUid)
        .get();

      const batch = adminDb.batch();
      snapshot.forEach((doc: QueryDocumentSnapshot) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return NextResponse.json({ success: true, message: 'All records deleted.' });
    }

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'Missing recordId parameter' },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const docRef = adminDb.collection('extractionRecords').doc(recordId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    if (docSnap.data()?.ownerUid !== ownerUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: 'Record deleted.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
