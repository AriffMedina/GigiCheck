import { ReactNode } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { c,s } from './theme';
export function Button({children,onPress,outline=false,disabled=false}:{children:ReactNode;onPress:()=>void;outline?:boolean;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,outline&&s.outline,{opacity:disabled?0.45:pressed?0.75:1}]}><Text style={[s.buttonText,outline&&{color:c.ink}]}>{children}</Text></Pressable>;
}
export function Field({label,...props}:TextInputProps&{label:string}) { return <View><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={c.muted} {...props} style={[s.input,props.style]}/></View>; }
export function Notice({text}:{text:string}) { return text?<Text accessibilityRole="alert" style={s.error}>{text}</Text>:null; }
