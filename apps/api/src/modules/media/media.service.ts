import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@tar/db';
import type { UpdateImageInput } from '@tar/shared';
import { ApiError } from '../../middleware/error-handler';
import { storage, keyFromUrl } from '../../lib/storage';

const { properties, propertyImages } = schema;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FULL_MAX_WIDTH = 1600;
const THUMB_W = 400;
const THUMB_H = 300;

export interface UploadFile {
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

// Sube imágenes: valida mimetype → sharp re-encode a WebP (full + thumb) →
// almacenamiento (nombre con hash de contenido) → registro en property_images.
// NUNCA confía en el archivo subido: siempre re-codifica (la guía del proyecto).
export async function uploadImages(propertyId: string, files: UploadFile[]) {
  await assertProperty(propertyId);
  if (!files.length) {
    throw new ApiError(400, 'no_files', 'No se recibió ninguna imagen.');
  }

  const existing = await db
    .select({
      position: propertyImages.position,
      isCover: propertyImages.isCover,
    })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));

  let position = existing.reduce((m, r) => Math.max(m, r.position), -1);
  let hasCover = existing.some((r) => r.isCover);
  const inserted = [];

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new ApiError(
        400,
        'invalid_image_type',
        'Formato no soportado. Usa JPG, PNG o WebP.',
      );
    }

    let full: { data: Buffer; info: sharp.OutputInfo };
    let thumb: Buffer;
    try {
      full = await sharp(file.buffer)
        .rotate() // respeta EXIF
        .resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      thumb = await sharp(file.buffer)
        .rotate()
        .resize({ width: THUMB_W, height: THUMB_H, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new ApiError(
        400,
        'invalid_image',
        'El archivo no es una imagen válida.',
      );
    }

    const hash = createHash('sha256').update(full.data).digest('hex').slice(0, 16);
    const urlWebp = await storage.save(`${propertyId}/${hash}.webp`, full.data);
    const urlThumb = await storage.save(
      `${propertyId}/${hash}_thumb.webp`,
      thumb,
    );

    position += 1;
    const isCover = !hasCover;
    hasCover = true;

    const [row] = await db
      .insert(propertyImages)
      .values({
        propertyId,
        urlWebp,
        urlThumb,
        width: full.info.width,
        height: full.info.height,
        position,
        isCover,
      })
      .returning();
    inserted.push(row);
  }

  return inserted;
}

// PATCH — reordenar / set cover / alt.
export async function updateImage(
  propertyId: string,
  imageId: string,
  patch: UpdateImageInput,
) {
  const [img] = await db
    .select()
    .from(propertyImages)
    .where(
      and(
        eq(propertyImages.id, imageId),
        eq(propertyImages.propertyId, propertyId),
      ),
    )
    .limit(1);
  if (!img) throw new ApiError(404, 'not_found', 'Imagen no encontrada.');

  // Solo una portada por propiedad.
  if (patch.isCover === true) {
    await db
      .update(propertyImages)
      .set({ isCover: false })
      .where(eq(propertyImages.propertyId, propertyId));
  }

  const set: Record<string, unknown> = {};
  if (patch.position !== undefined) set.position = patch.position;
  if (patch.isCover !== undefined) set.isCover = patch.isCover;
  if (patch.alt !== undefined) set.alt = patch.alt;

  const [updated] = await db
    .update(propertyImages)
    .set(set)
    .where(eq(propertyImages.id, imageId))
    .returning();
  return updated;
}

// DELETE — borra del disco y de la BD; si era portada, promueve la siguiente.
export async function deleteImage(propertyId: string, imageId: string) {
  const [img] = await db
    .select()
    .from(propertyImages)
    .where(
      and(
        eq(propertyImages.id, imageId),
        eq(propertyImages.propertyId, propertyId),
      ),
    )
    .limit(1);
  if (!img) throw new ApiError(404, 'not_found', 'Imagen no encontrada.');

  await storage.remove(keyFromUrl(img.urlWebp));
  await storage.remove(keyFromUrl(img.urlThumb));
  await db.delete(propertyImages).where(eq(propertyImages.id, imageId));

  if (img.isCover) {
    const [next] = await db
      .select({ id: propertyImages.id })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(asc(propertyImages.position))
      .limit(1);
    if (next) {
      await db
        .update(propertyImages)
        .set({ isCover: true })
        .where(eq(propertyImages.id, next.id));
    }
  }
}
