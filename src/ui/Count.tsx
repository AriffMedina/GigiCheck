import { Image,Pressable,Text,View } from 'react-native';
import { Draft,Entry,Session,totals } from '../domain';
import { photoUri } from '../services/photos';
import { Button } from './controls';
import { c,s } from './theme';
export function Count({session,rows,draft,onAdd,onEdit,onDraft,onDiscard,onExport,onClose,onReopen,onDelete}:{session:Session;rows:Entry[];draft:Draft|null;onAdd:()=>void;onEdit:(e:Entry)=>void;onDraft:()=>void;onDiscard:()=>void;onExport:()=>void;onClose:()=>void;onReopen:()=>void;onDelete:()=>void}) {
  const sum=totals(rows);const active=session.status==='active';
  return <View style={{gap:20}}><Text style={s.title}>{active?'Todo en\norden.':'Conteo de\nfaltantes'}</Text><Text style={s.text}>{session.workDate} · {session.shift}</Text><Text style={s.muted}>{active?'En curso':'Finalizado'} · Guardado en tu teléfono</Text><View style={s.row}><Text style={s.text}>{sum.products} productos registrados</Text><Text style={s.text}>{sum.units} unidades faltantes</Text></View><View style={s.line}/><Text style={s.h2}>Mi conteo</Text>
    {!rows.length&&<Text style={s.muted}>Empieza con el primer producto que hace falta.</Text>}
    {rows.map(row=><Pressable accessibilityRole="button" accessibilityLabel={`Revisar ${row.name}, ${row.quantity} unidades`} key={row.id} onPress={()=>onEdit(row)} style={[s.row,{paddingVertical:12,borderBottomWidth:1,borderColor:c.line}]}>{row.photo?<Image source={{uri:photoUri(row.photo)}} style={{width:62,height:68,borderRadius:12}}/>:<View style={[s.badge,{width:62,height:68,justifyContent:'center'}]}><Text style={{color:c.soft,fontSize:25}}>✧</Text></View>}<View style={{flex:1}}><Text style={[s.text,{fontWeight:'600'}]}>{row.name}</Text><Text style={s.muted}>{[row.brand,row.presentation||'Sin especificar'].filter(Boolean).join(' · ')}</Text></View><Text style={[s.h2,{fontVariant:['tabular-nums']}]}>{row.quantity}</Text></Pressable>)}
    {draft&&<View style={[s.badge,{gap:12}]}><Text style={s.text}>Un borrador pendiente</Text><Text style={s.muted}>No se incluye en totales ni en el PDF.</Text><Button outline onPress={onDraft}>Retomar producto</Button><Button outline onPress={onDiscard}>Descartar borrador</Button></View>}
    {active&&<Button onPress={onAdd}>＋ Agregar producto</Button>}<Button outline disabled={!rows.length} onPress={onExport}>Exportar PDF</Button>
    {active?<Button outline onPress={onClose}>Finalizar conteo</Button>:<Button onPress={onReopen}>Reabrir para editar</Button>}<Button outline onPress={onDelete}>Eliminar conteo</Button>
  </View>;
}
