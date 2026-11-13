import { useState } from 'react';
import { Text, View } from 'react-native';
import { localDate,validDate } from '../domain';
import { createSession } from '../data/repository';
import { Button,Field,Notice } from './controls';
import { s } from './theme';
export function NewSession({onCreated}:{onCreated:(id:string)=>void}) {
  const [date,setDate]=useState(localDate()); const [shift,setShift]=useState(''); const [branch,setBranch]=useState(''); const [responsible,setResponsible]=useState(''); const [notes,setNotes]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function start() { if(busy)return;setError(''); if(!validDate(date)){setError('Usa una fecha válida: AAAA-MM-DD.');return;}if(!shift.trim()){setError('Escribe el turno.');return;}setBusy(true);try{onCreated(await createSession(date,shift,branch,responsible,notes));}catch{setError('No se pudo crear. Revisa si ya tienes un conteo activo o el espacio disponible.');}finally{setBusy(false);} }
  return <View style={{gap:18}}><Text style={s.title}>Todo en{`\n`}orden.</Text><Text style={s.muted}>Un producto, una cantidad. Tus faltantes guardados en tu teléfono.</Text><Field label="Fecha de trabajo" value={date} onChangeText={setDate} maxLength={10}/><Field label="Turno" placeholder="Por ejemplo, Vespertino" value={shift} onChangeText={setShift} maxLength={40}/><Field label="Sucursal (opcional)" value={branch} onChangeText={setBranch} maxLength={200}/><Field label="Responsable (opcional)" value={responsible} onChangeText={setResponsible} maxLength={200}/><Field label="Notas (opcional)" value={notes} onChangeText={setNotes} maxLength={1000}/><Notice text={error}/><Button onPress={()=>void start()} disabled={busy}>{busy?'Creando…':'Comenzar conteo'}</Button></View>;
}
