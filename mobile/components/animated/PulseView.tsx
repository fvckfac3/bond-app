import { StyleProp, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export default function PulseView({ 
  children, 
  duration = 2000,
  style 
}: PulseViewProps) {
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: 1.05 }}
      transition={{
        type: 'timing',
        duration,
        loop: true,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}