import { Platform, StyleSheet } from 'react-native';
export const c={bg:'#100D17',surface:'#1C1528',ink:'#FAF6FF',muted:'#C8BCD6',accent:'#AE80EA',line:'#76608D',soft:'#DCC6FA',danger:'#FFB6BE'};
export const s=StyleSheet.create({
  page:{flex:1,backgroundColor:c.bg}, content:{padding:24,paddingBottom:40,gap:18}, row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  title:{color:c.ink,fontFamily:Platform.OS==='ios'?'Georgia':'serif',fontWeight:'700',fontSize:44,lineHeight:47,letterSpacing:-1},
  h2:{color:c.ink,fontSize:23,fontWeight:'700'}, text:{color:c.ink,fontSize:17,lineHeight:24}, muted:{color:c.muted,fontSize:15,lineHeight:22},
  button:{minHeight:52,borderRadius:14,backgroundColor:c.accent,alignItems:'center',justifyContent:'center',paddingHorizontal:18,paddingVertical:12},
  outline:{backgroundColor:'transparent',borderWidth:1,borderColor:c.soft},buttonText:{color:c.bg,fontSize:17,fontWeight:'700',textAlign:'center'},
  input:{backgroundColor:c.surface,color:c.ink,minHeight:52,padding:14,borderRadius:10,borderWidth:1,borderColor:c.line,fontSize:17},
  label:{color:c.soft,fontSize:15,marginBottom:7},line:{height:1,backgroundColor:c.line},error:{color:c.danger,fontSize:15,lineHeight:22},
  badge:{backgroundColor:c.surface,padding:14,borderRadius:12},photo:{height:150,width:130,borderRadius:16,backgroundColor:c.surface},
  tab:{flex:1,padding:15,alignItems:'center'},nav:{flexDirection:'row',borderTopWidth:1,borderColor:c.line},
});
