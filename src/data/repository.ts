import { randomUUID } from 'expo-crypto';
import { Draft, Entry, Session, validate } from '../domain';
import { database } from './database';
export async function sessions(): Promise<Session[]> { return (await database()).getAllAsync<Session>('SELECT * FROM sessions ORDER BY workDate DESC, rowid DESC'); }
export async function entries(id: string): Promise<Entry[]> { return (await database()).getAllAsync<Entry>('SELECT * FROM entries WHERE sessionId=? AND deletedAt IS NULL ORDER BY rowid', id); }
export async function getDraft(id: string): Promise<Draft | null> { return (await database()).getFirstAsync<Draft>('SELECT * FROM drafts WHERE sessionId=?', id); }
export async function createSession(workDate: string, shift: string, branch: string, responsible: string, notes: string): Promise<string> {
  const id = randomUUID();
  await (await database()).runAsync('INSERT INTO sessions(id,workDate,shift,timezone,status,branch,responsible,notes) VALUES(?,?,?,?,?,?,?,?)', id, workDate, shift.trim(), Intl.DateTimeFormat().resolvedOptions().timeZone, 'active', branch, responsible, notes);
  return id;
}
export async function saveDraft(d: Draft): Promise<void> {
  await (await database()).runAsync('INSERT INTO drafts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,brand=excluded.brand,presentation=excluded.presentation,category=excluded.category,quantityInput=excluded.quantityInput,note=excluded.note,photo=excluded.photo,imageRevision=excluded.imageRevision,formRevision=excluded.formRevision,source=excluded.source', d.id,d.sessionId,d.name,d.brand,d.presentation,d.category,d.quantityInput,d.note,d.photo,d.imageRevision,d.formRevision,d.source,d.editingEntryId);
}
export const blankDraft = (sessionId: string): Draft => ({id:randomUUID(),sessionId,name:'',brand:'',presentation:'',category:'',quantityInput:'',note:'',photo:null,imageRevision:0,formRevision:0,source:'manual',editingEntryId:null});
export async function discardDraft(id: string): Promise<void> { await (await database()).runAsync('DELETE FROM drafts WHERE id=?',id); }
export type Merge = { mode: 'sum' | 'replace'; target: Entry };
export async function confirm(d: Draft, merge?: Merge): Promise<void> {
  const amount = validate(d); const db = await database();
  await db.withExclusiveTransactionAsync(async tx => {
    const active = await tx.getFirstAsync<Session>('SELECT * FROM sessions WHERE id=? AND status=?',d.sessionId,'active');
    if (!active) throw new Error('Reabre el conteo antes de modificarlo.');
    if (await tx.getFirstAsync('SELECT id FROM consumed_drafts WHERE id=?',d.id)) return;
    if (!await tx.getFirstAsync('SELECT id FROM drafts WHERE id=?',d.id)) throw new Error('El borrador ya fue procesado.');
    if (merge) {
      const current = await tx.getFirstAsync<Entry>('SELECT * FROM entries WHERE id=? AND sessionId=? AND deletedAt IS NULL',merge.target.id,d.sessionId);
      if (!current) throw new Error('El producto existente cambió. Reintenta.');
      const result = merge.mode === 'sum' ? current.quantity + amount : amount;
      if (result > 999) throw new Error('La suma supera 999. Corrige la cantidad o guarda separado.');
      await tx.runAsync('UPDATE entries SET quantity=? WHERE id=?',result,current.id);
    } else await tx.runAsync('INSERT INTO entries VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',d.id,d.sessionId,d.name.trim(),d.brand.trim(),d.presentation.trim(),d.category.trim(),amount,d.note,d.photo,d.id,d.source,null);
    await tx.runAsync('INSERT INTO consumed_drafts VALUES(?,?)',d.id,d.sessionId);
    await tx.runAsync('DELETE FROM drafts WHERE id=?',d.id);
    await tx.runAsync('UPDATE sessions SET revision=revision+1 WHERE id=?',d.sessionId);
  });
}
export async function updateEntry(e: Entry, d: Draft): Promise<void> {
  const amount=validate(d); const db=await database();
  await db.withExclusiveTransactionAsync(async tx => {
    if (!await tx.getFirstAsync('SELECT id FROM sessions WHERE id=? AND status=?',e.sessionId,'active')) throw new Error('El conteo está cerrado.');
    await tx.runAsync('UPDATE entries SET name=?,brand=?,presentation=?,category=?,quantity=?,note=?,photo=?,source=? WHERE id=?',d.name.trim(),d.brand.trim(),d.presentation.trim(),d.category.trim(),amount,d.note,d.photo,d.source,e.id);
    await tx.runAsync('DELETE FROM drafts WHERE id=?',d.id);
    await tx.runAsync('UPDATE sessions SET revision=revision+1 WHERE id=?',e.sessionId);
  });
}
async function deletion(id:string,undo:boolean):Promise<void>{const db=await database();await db.withExclusiveTransactionAsync(async tx=>{const row=await tx.getFirstAsync<Entry>('SELECT e.* FROM entries e JOIN sessions s ON s.id=e.sessionId WHERE e.id=? AND s.status=?',id,'active');if(!row)throw new Error('El conteo está cerrado.');if(undo)await tx.runAsync('UPDATE entries SET deletedAt=NULL WHERE id=? AND deletedAt>=?',id,Date.now()-8000);else await tx.runAsync('UPDATE entries SET deletedAt=? WHERE id=?',Date.now(),id);await tx.runAsync('UPDATE sessions SET revision=revision+1 WHERE id=?',row.sessionId);});}
export const removeEntry=(id:string)=>deletion(id,false);
export const undoEntry=(id:string)=>deletion(id,true);
export async function closeSession(id: string): Promise<void> {
  const db=await database(); await db.withExclusiveTransactionAsync(async tx => {
    if (await tx.getFirstAsync('SELECT id FROM drafts WHERE sessionId=?',id)) throw new Error('Resuelve o descarta el borrador antes de finalizar.');
    await tx.runAsync('UPDATE sessions SET status=? WHERE id=?','closed',id);
  });
}
export async function reopenSession(id: string): Promise<void> { await (await database()).runAsync('UPDATE sessions SET status=? WHERE id=?','active',id); }
export async function deleteSession(id: string): Promise<void> { await (await database()).runAsync('DELETE FROM sessions WHERE id=?',id); }
export async function wipe(): Promise<void> { await (await database()).execAsync('DELETE FROM sessions;'); }
