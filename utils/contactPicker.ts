export type PickedContact = { name?: string; phone?: string };

interface NavigatorContacts {
  contacts?: {
    select: (
      properties: string[],
      options?: { multiple?: boolean }
    ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
  };
}

export function isContactPickerSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & NavigatorContacts;
  return (
    'contacts' in nav &&
    !!nav.contacts &&
    typeof nav.contacts.select === 'function'
  );
}

export async function pickContact(): Promise<PickedContact | null> {
  if (!isContactPickerSupported()) return null;
  const nav = navigator as Navigator & NavigatorContacts;
  try {
    const contacts = await nav.contacts!.select(['name', 'tel'], {
      multiple: false,
    });
    if (!contacts || contacts.length === 0) return null;
    const c = contacts[0];
    const name = Array.isArray(c.name) && c.name.length > 0 ? c.name[0] : undefined;
    const phone = Array.isArray(c.tel) && c.tel.length > 0 ? c.tel[0] : undefined;
    return { name, phone };
  } catch (err) {
    console.warn('Contact picker failed or was cancelled', err);
    return null;
  }
}
