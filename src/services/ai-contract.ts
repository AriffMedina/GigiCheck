export interface Suggestion { name: string | null; brand: string | null; presentation: string | null; category: string | null; warnings: string[] }
export interface Identification { requestId: string; imageRevision: number; status: 'identified' | 'uncertain' | 'unreadable'; suggestion: Suggestion }
function object(value: unknown): value is Record<string,unknown> { return !!value && typeof value==='object' && !Array.isArray(value); }
function keys(value: Record<string,unknown>, expected: string[]): boolean { return Object.keys(value).length===expected.length && expected.every(key=>key in value); }
export function parseIdentification(value: unknown): Identification {
  if (!object(value) || !keys(value,['requestId','imageRevision','status','suggestion']) || typeof value.requestId!=='string' || !Number.isInteger(value.imageRevision) || !['identified','uncertain','unreadable'].includes(String(value.status))) throw new Error('Respuesta de IA inválida. Puedes continuar manualmente.');
  const s=value.suggestion;
  if (!object(s) || !keys(s,['name','brand','presentation','category','warnings']) || !['name','brand','presentation','category'].every(key=>s[key]===null || (typeof s[key]==='string' && s[key].length<=200)) || !Array.isArray(s.warnings) || s.warnings.length>5 || !s.warnings.every(w=>typeof w==='string' && w.length<=200)) throw new Error('Sugerencias de IA inválidas.');
  // Runtime validation above checks the complete external contract before narrowing.
  return value as unknown as Identification;
}
