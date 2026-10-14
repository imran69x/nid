import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'ইউজারনেম ও পাসওয়ার্ড দিন' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি' },
        { status: 500 }
      );
    }

    const inputUsername = String(username).trim().toLowerCase();
    const snapshot = await adminDb.collection('users').get();

    // Case-insensitive username match
    const matchingDoc = snapshot.docs.find(
      (d) => String(d.data().username || '').trim().toLowerCase() === inputUsername
    );

    if (!matchingDoc) {
      return NextResponse.json(
        { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি (User not found)' },
        { status: 404 }
      );
    }

    const data = matchingDoc.data();

    // Check password
    if (String(data.password || '') !== String(password).trim()) {
      return NextResponse.json(
        { success: false, error: 'ভুল পাসওয়ার্ড (Incorrect password)' },
        { status: 401 }
      );
    }

    // Check lock / block
    if (data.isLocked === true || data.isBlocked === true) {
      return NextResponse.json(
        { success: false, error: 'BLOCKED' },
        { status: 403 }
      );
    }

    const user = {
      id: matchingDoc.id,
      uid: matchingDoc.id,
      username: data.username,
      isAdmin: Boolean(data.isAdmin),
      isLocked: false,
    };

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error('Login API error:', error);
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
