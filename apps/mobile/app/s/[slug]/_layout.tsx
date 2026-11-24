import { Stack } from 'expo-router';
import { color, font } from '../../../src/theme';

export default function SalonLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.base },
        headerTintColor: color.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: font.display, fontSize: 22 },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: color.base },
      }}
    />
  );
}
