/**
 * Durable garage-item photo storage.
 *
 * Photos used to live only in sessionStorage, so cards went blank after a tab
 * close, another browser, or a quota failure during save. We now keep them in
 * localStorage (with sessionStorage as a fast cache) and always stamp a cover
 * onto the GarageItem.photo field for card renders.
 */

const keyFor = (id: string) => `cf_i_photos_${id}`;

function parsePhotoList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string" && p.length > 0);
  } catch {
    return [];
  }
}

export function readItemPhotos(id: string): string[] {
  if (typeof window === "undefined") return [];
  let fromSession: string[] = [];
  try {
    fromSession = parsePhotoList(window.sessionStorage.getItem(keyFor(id)));
  } catch {
    /* ignore */
  }
  let fromLocal: string[] = [];
  try {
    fromLocal = parsePhotoList(window.localStorage.getItem(keyFor(id)));
  } catch {
    /* ignore */
  }
  if (fromSession.length) {
    // Promote session-only uploads into localStorage so cards survive tab close.
    if (!fromLocal.length) {
      try {
        writeBucket(window.localStorage, id, fromSession);
      } catch {
        try {
          writeBucket(window.localStorage, id, fromSession.slice(0, 1));
        } catch {
          /* quota — cover may still live on GarageItem.photo */
        }
      }
    }
    return fromSession;
  }
  return fromLocal;
}

function writeBucket(storage: Storage, id: string, photos: string[]) {
  const key = keyFor(id);
  if (!photos.length) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, JSON.stringify(photos));
}

/**
 * Persist photos. Prefers the full set; on quota errors falls back to cover-only
 * so ItemCards still have something to show.
 */
export function writeItemPhotos(id: string, photos: string[]): string | undefined {
  if (typeof window === "undefined") return photos[0];
  const clean = photos.filter((p) => typeof p === "string" && p.length > 0);
  const cover = clean[0];

  try {
    writeBucket(window.sessionStorage, id, clean);
  } catch {
    try {
      writeBucket(window.sessionStorage, id, cover ? [cover] : []);
    } catch {
      /* session full — localStorage still tried below */
    }
  }

  try {
    writeBucket(window.localStorage, id, clean);
  } catch {
    try {
      writeBucket(window.localStorage, id, cover ? [cover] : []);
    } catch {
      /* both full — cover still returned for GarageItem.photo */
    }
  }

  return cover;
}

export function clearItemPhotos(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(keyFor(id));
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.removeItem(keyFor(id));
  } catch {
    /* ignore */
  }
}
