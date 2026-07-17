import { createHash } from 'node:crypto';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import {
  ALLOWED_VIDEO_MIME,
  type UpdateVideoInput,
  type VideoOrientation,
} from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { storage, keyFromUrl } from '../../lib/storage';

const { properties, propertyVideos } = schema;

const MIME_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export interface UploadVideoFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

async function assertProperty(id: string): Promise<void> {
  const [p] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!p) throw new ApiError(404, 'not_found', 'Propiedad no encontrada.');
}

// Valida por "magic bytes" que el buffer es realmente un video del tipo esperado.
// No transcodificamos (el stack no lleva ffmpeg), pero no confiamos en el mimetype
// declarado: comprobamos la firma del contenedor.
function looksLikeVideo(buf: Buffer, mime: string): boolean {
  if (mime === 'video/webm') {
    // EBML header (Matroska/WebM).
    return (
      buf.length > 4 &&
      buf[0] === 0x1a &&
      buf[1] === 0x45 &&
      buf[2] === 0xdf &&
      buf[3] === 0xa3
    );
  }
  // mp4 / mov (quicktime): caja 'ftyp' en el offset 4.
  return buf.length > 12 && buf.toString('latin1', 4, 8) === 'ftyp';
}

export async function uploadVideo(
  propertyId: string,
  file: UploadVideoFile | undefined,
  orientation: VideoOrientation,
) {
  await assertProperty(propertyId);
  if (!file) throw new ApiError(400, 'no_file', 'No se recibió ningún video.');
  if (!(ALLOWED_VIDEO_MIME as readonly string[]).includes(file.mimetype)) {
    throw new ApiError(
      400,
      'bad_type',
      'Formato no soportado. Usa MP4, WebM o MOV.',
    );
  }
  if (!looksLikeVideo(file.buffer, file.mimetype)) {
    throw new ApiError(400, 'not_a_video', 'El archivo no es un video válido.');
  }

  const ext = MIME_EXT[file.mimetype] ?? 'mp4';
  const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 16);
  const url = await storage.save(
    `${propertyId}/videos/${hash}.${ext}`,
    file.buffer,
  );

  const existing = await db
    .select({ position: propertyVideos.position })
    .from(propertyVideos)
    .where(eq(propertyVideos.propertyId, propertyId));
  const position = existing.reduce((m, r) => Math.max(m, r.position), -1) + 1;

  const [row] = await db
    .insert(propertyVideos)
    .values({ propertyId, url, orientation, position })
    .returning();
  return row!;
}

export async function listVideos(propertyId: string) {
  return db
    .select()
    .from(propertyVideos)
    .where(eq(propertyVideos.propertyId, propertyId))
    .orderBy(asc(propertyVideos.position));
}

export async function deleteVideo(
  propertyId: string,
  videoId: string,
): Promise<void> {
  const [v] = await db
    .select()
    .from(propertyVideos)
    .where(
      and(
        eq(propertyVideos.id, videoId),
        eq(propertyVideos.propertyId, propertyId),
      ),
    )
    .limit(1);
  if (!v) throw new ApiError(404, 'not_found', 'Video no encontrado.');
  await storage.remove(keyFromUrl(v.url));
  await db.delete(propertyVideos).where(eq(propertyVideos.id, videoId));
}

export async function updateVideo(
  propertyId: string,
  videoId: string,
  input: UpdateVideoInput,
) {
  const set: Record<string, unknown> = {};
  if (input.position !== undefined) set.position = input.position;
  if (input.orientation !== undefined) set.orientation = input.orientation;
  const [row] = await db
    .update(propertyVideos)
    .set(set)
    .where(
      and(
        eq(propertyVideos.id, videoId),
        eq(propertyVideos.propertyId, propertyId),
      ),
    )
    .returning();
  if (!row) throw new ApiError(404, 'not_found', 'Video no encontrado.');
  return row;
}
