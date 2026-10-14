import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'settings') {
      const docSnap = await adminDb.collection('settings').doc('system').get();
      if (!docSnap.exists) {
        return NextResponse.json({
          success: true,
          settings: { scanningEnabled: true, noticeMessage: '' },
        });
      }
      return NextResponse.json({ success: true, settings: docSnap.data() });
    }

    // Default: list users
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username || '',
        password: data.password || '',
        isAdmin: Boolean(data.isAdmin),
        isLocked: Boolean(data.isLocked || data.isBlocked),
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Seed admin if empty
    if (action === 'seed-admin') {
      const snap = await adminDb.collection('users').get();
      if (snap.empty) {
        await adminDb.collection('users').add({
          username: 'admin',
          password: 'adminpassword123',
          isAdmin: true,
          isLocked: false,
          isBlocked: false,
          createdAt: FieldValue.serverTimestamp(),
        });
        return NextResponse.json({ success: true, seeded: true, message: 'Admin user created' });
      }
      return NextResponse.json({ success: true, seeded: false, message: 'Users already exist' });
    }

    // 2. Create user
    if (action === 'create-user') {
      const { username, password, isAdmin } = body;
      const cleanUsername = String(username || '').trim().toLowerCase();
      const cleanPassword = String(password || '').trim();

      if (!cleanUsername || !cleanPassword) {
        return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
      }

      const existing = await adminDb.collection('users').where('username', '==', cleanUsername).get();
      if (!existing.empty) {
        return NextResponse.json({ success: false, error: 'এই ইউজারনেম ইতিমধ্যে বিদ্যমান' }, { status: 400 });
      }

      const ref = await adminDb.collection('users').add({
        username: cleanUsername,
        password: cleanPassword,
        isAdmin: Boolean(isAdmin),
        isLocked: false,
        isBlocked: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, id: ref.id });
    }

    // 3. Toggle lock/block
    if (action === 'toggle-lock') {
      const { userId, isLocked } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
      }

      await adminDb.collection('users').doc(userId).update({
        isLocked: Boolean(isLocked),
        isBlocked: Boolean(isLocked),
      });

      return NextResponse.json({ success: true });
    }

    // 4. Delete user
    if (action === 'delete-user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
      }

      await adminDb.collection('users').doc(userId).delete();
      return NextResponse.json({ success: true });
    }

    // 5. Update system settings
    if (action === 'update-settings') {
      const { settings } = body;
      await adminDb.collection('settings').doc('system').set(settings, { merge: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
