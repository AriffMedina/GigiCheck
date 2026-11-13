import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { database } from '../data/database';
const photos = () => new Directory(Paths.document, 'photos');
export const photoUri = (relative: string) => new File(photos(), relative).uri;
export async function acceptPhoto(uri: string): Promise<string> {
  photos().create({ idempotent: true, intermediates: true });
  const name=`${randomUUID()}.jpg`; const target=new File(photos(),name);
  await new File(uri).copy(target);
  if (!target.exists || target.size === 0) throw new Error('No se pudo guardar la foto. Revisa el espacio disponible.');
  return name;
}
export async function sanitizedImage(relative: string): Promise<File> {
  const context=ImageManipulator.manipulate(photoUri(relative));
  const original=await context.renderAsync();
  if (Math.max(original.width,original.height)>1600) context.resize(original.width>=original.height?{width:1600}:{height:1600});
  const image=await context.renderAsync();
  const saved=await image.saveAsync({format:SaveFormat.JPEG,compress:0.7});
  const file=new File(saved.uri);
  if (file.size>2*1024*1024) { file.delete(); throw new Error('La foto supera 2 MB. Toma otra foto más cerca de la etiqueta.'); }
  return file;
}
export async function cleanPhotos(): Promise<void> {
  const db=await database();
  await db.runAsync('DELETE FROM entries WHERE deletedAt IS NOT NULL AND deletedAt<?',Date.now()-8000);
  const used=await db.getAllAsync<{photo:string}>('SELECT photo FROM entries WHERE photo IS NOT NULL UNION SELECT photo FROM drafts WHERE photo IS NOT NULL');
  const refs=new Set(used.map(row=>row.photo));
  if (photos().exists) for (const file of photos().list()) if (file instanceof File && !refs.has(file.name)) file.delete();
}
export function clearPhotoFiles(): void { if (photos().exists) photos().delete(); const exports=new Directory(Paths.cache,'reports'); if(exports.exists)exports.delete(); }
