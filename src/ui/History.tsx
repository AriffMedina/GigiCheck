import { Text,View } from 'react-native';
import { Session } from '../domain';
import { Button } from './controls';
import { s } from './theme';
export function History({sessions,onOpen,onNew}:{sessions:Session[];onOpen:(id:string)=>void;onNew:()=>void}) {
  return <View style={{gap:20}}><Text style={s.title}>Tu historial.</Text><Text style={s.muted}>Cada turno, en su lugar.</Text>{sessions.map(item=><View key={item.id} style={[s.badge,{gap:12}]}><Text style={s.h2}>{item.workDate}</Text><Text style={s.text}>{item.shift} · {item.status==='active'?'En curso':'Finalizado'}</Text><Button outline onPress={()=>onOpen(item.id)}>Abrir conteo</Button></View>)}{!sessions.length&&<Text style={s.text}>Todavía no tienes conteos.</Text>}<Button onPress={onNew}>Comenzar otro conteo</Button></View>;
}
