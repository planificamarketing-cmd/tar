import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { env } from '../env';

// Interfaz de almacenamiento de media. El driver `local` guarda en el disco del
// VPS (`MEDIA_DIR`). La interfaz queda abstraída para que un futuro driver S3
// sea adenda y no una reescritura (CLAUDE.md / PRD §5.3, A.3).
export interface StorageDriver {
  save(key: string, data: Buffer): Promise<string>; // devuelve la URL pública
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class LocalStorage implements StorageDriver {
  constructor(
    private readonly baseDir: string,
    private readonly baseUrl: string,
  ) {}

  publicUrl(key: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}/${key}`;
  }

  async save(key: string, data: Buffer): Promise<string> {
    const dest = join(this.baseDir, key);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, data);
    return this.publicUrl(key);
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(join(this.baseDir, key));
    } catch {
      // Idempotente: si ya no existe, no es error.
    }
  }
}

function createStorage(): StorageDriver {
  // Único driver soportado por ahora (PRD: nada de S3/SDK de AWS).
  return new LocalStorage(env.MEDIA_DIR, env.MEDIA_BASE_URL);
}

export const storage: StorageDriver = createStorage();

// Deriva la key (ruta relativa) desde una URL pública, para poder borrarla.
export function keyFromUrl(url: string): string {
  const base = env.MEDIA_BASE_URL.replace(/\/$/, '');
  return url.startsWith(base) ? url.slice(base.length + 1) : url;
}
