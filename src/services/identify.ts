import * as SecureStore from 'expo-secure-store';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { Draft } from '../domain';
import { parseIdentification } from './ai-contract';
export const TOKEN_KEY='gigicheck.device-token';
export const URL_KEY='gigicheck.service-url';
export const CONSENT_KEY='gigicheck.consent-v1';
export async function identify(draft: Draft, image: File, requestId: string, signal: AbortSignal) {
  const [token,url,consent]=await Promise.all([SecureStore.getItemAsync(TOKEN_KEY),SecureStore.getItemAsync(URL_KEY),SecureStore.getItemAsync(CONSENT_KEY)]);
  if(!consent) throw new Error('Se requiere tu consentimiento antes de enviar la foto.');
  if(!token||!url) throw new Error('Configura el servicio de IA y la credencial en Ajustes. Puedes completar el producto manualmente.');
  const body=new FormData(); body.append('image',image,'product.jpg');
  body.append('requestId',requestId);body.append('draftId',draft.id);body.append('imageRevision',String(draft.imageRevision));body.append('schemaVersion','1');
  const response=await fetch(`${url.replace(/\/$/,'')}/v1/identify-product`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body,signal});
  if(!response.ok) throw new Error(({401:'Credencial inválida o revocada.',413:'Foto demasiado grande.',429:'Cuota de IA agotada.'} as Record<number,string>)[response.status]??'El servicio de IA no está disponible. Continúa manualmente.');
  const result=parseIdentification(await response.json());
  if(result.requestId!==requestId||result.imageRevision!==draft.imageRevision) throw new Error('Se descartó una respuesta de otra fotografía.');
  return result;
}
