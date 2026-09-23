import { Stack } from 'expo-router';
import BucketListScreen from '../src/screens/features/BucketListScreen';

export default function BucketListRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Bucket List', headerBackTitle: 'Back' }} />
      <BucketListScreen />
    </>
  );
}
