// SkeletonLoader - Subtle loading placeholder
// Built following: animation-patterns, polish
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, borderRadius as radii, spacing } from '../../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = radii.sm,
  style,
}: SkeletonLoaderProps) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{
        type: 'timing',
        duration: 1200,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.lightGray,
  },
});