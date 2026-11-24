import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = 'florece.recent-salons';
const CITAS_KEY = 'florece.appointments';

export type RecentSalon = {
  slug: string;
  name: string;
  city: string | null;
  seenAt: string;
};

export type SavedAppointment = {
  viewToken: string;
  slug: string;
  salonName: string;
  name: string;
  status: string;
  employeeName: string | null;
  services: string[];
  startTime: string | null;
  endTime: string | null;
};

async function readJson<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function loadRecentSalons(): Promise<RecentSalon[]> {
  const rows = await readJson<RecentSalon>(RECENT_KEY);
  return rows.sort((a, b) => (a.seenAt < b.seenAt ? 1 : -1));
}

export async function rememberSalon(salon: {
  slug: string;
  name: string;
  city?: string | null;
}): Promise<void> {
  const all = await loadRecentSalons();
  const next: RecentSalon[] = [
    {
      slug: salon.slug,
      name: salon.name,
      city: salon.city ?? null,
      seenAt: new Date().toISOString(),
    },
    ...all.filter((row) => row.slug !== salon.slug),
  ].slice(0, 12);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export async function loadAppointments(): Promise<SavedAppointment[]> {
  return readJson<SavedAppointment>(CITAS_KEY);
}

export async function saveAppointment(appointment: SavedAppointment): Promise<void> {
  const all = await loadAppointments();
  const next = [
    appointment,
    ...all.filter((row) => row.viewToken !== appointment.viewToken),
  ];
  await AsyncStorage.setItem(CITAS_KEY, JSON.stringify(next));
}

export async function replaceAppointments(rows: SavedAppointment[]): Promise<void> {
  await AsyncStorage.setItem(CITAS_KEY, JSON.stringify(rows));
}
