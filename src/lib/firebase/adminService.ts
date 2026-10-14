export interface DbUser {
  id: string;
  username: string;
  password?: string;
  isAdmin: boolean;
  isLocked: boolean;
  isBlocked?: boolean;
  createdAt?: unknown;
}

export interface SystemSettings {
  scanningEnabled: boolean;
  noticeMessage?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  scanningEnabled: true,
  noticeMessage: '',
};

export async function getAllUsers(): Promise<DbUser[]> {
  try {
    const res = await fetch('/api/admin');
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch users');
    }
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createDbUser(
  username: string,
  password: string,
  isAdmin: boolean
): Promise<string> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername) throw new Error('ইউজারনেম লিখুন');
  if (!cleanPassword) throw new Error('পাসওয়ার্ড লিখুন');

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-user',
      username: cleanUsername,
      password: cleanPassword,
      isAdmin,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'ইউজার তৈরি ব্যর্থ হয়েছে');
  }

  return data.id;
}

export async function toggleUserLock(userId: string, currentLocked: boolean): Promise<void> {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'toggle-lock',
      userId,
      isLocked: !currentLocked,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
  }
}

export async function deleteDbUser(userId: string): Promise<void> {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete-user',
      userId,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'ইউজার মুছতে ব্যর্থ হয়েছে');
  }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const res = await fetch('/api/admin?action=settings');
    const data = await res.json();
    if (!res.ok || !data.success) {
      return DEFAULT_SETTINGS;
    }
    return data.settings || DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update-settings',
      settings,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'সেটিংস আপডেট ব্যর্থ হয়েছে');
  }
}

export async function seedInitialAdminIfEmpty(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed-admin' }),
    });
    const data = await res.json();
    return Boolean(data.seeded);
  } catch (e) {
    console.error('Failed to seed admin:', e);
    return false;
  }
}
