import { Stack } from 'expo-router';
import MemoryLaneScreen from '../src/screens/features/MemoryLaneScreen';

export default function MemoryLaneRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Memory Lane', headerBackTitle: 'Back' }} />
      <MemoryLaneScreen />
    </>
  );
}
