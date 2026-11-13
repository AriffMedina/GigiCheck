import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Entry, Session } from '../domain';
import { photoUri } from './photos';
import { reportHtml, reportName } from './report-html';
export async function createReport(session: Session, rows: Entry[], includePhotos: boolean): Promise<string> {
  if (!rows.length) throw new Error('Agrega al menos un producto antes de exportar.');
  const snapshot=rows.map(row=>({...row})); const images:Record<string,string>={};
  if(includePhotos) for(const row of snapshot) if(row.photo) { const file=new File(photoUri(row.photo)); if(file.exists) images[row.id]=await file.base64(); }
  const result=await Print.printToFileAsync({html:reportHtml({...session},snapshot,images,new Date().toLocaleString('es-MX')),width:612,height:792});
  const directory=new Directory(Paths.cache,'reports'); directory.create({idempotent:true});
  const file=new File(directory,`${Date.now()}_${reportName(session)}`); await new File(result.uri).move(file);
  return file.uri;
}
export async function shareReport(uri: string): Promise<void> {
  if(!await Sharing.isAvailableAsync()) throw new Error('Compartir no está disponible en este dispositivo.');
  await Sharing.shareAsync(uri,{mimeType:'application/pdf',UTI:'com.adobe.pdf',dialogTitle:'Compartir conteo de faltantes'});
}
