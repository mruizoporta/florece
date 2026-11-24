import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { avisosDeStaff } from '../../src/lib/push';
import { cargarSesion, useSesion } from '../../src/lib/staff';
import { color } from '../../src/theme';

export default function SalonStaffLayout() {
  const sesion = useSesion();
  const usuario = sesion ? `${sesion.tenant.slug}:${sesion.user.id}` : null;

  useEffect(() => {
    void cargarSesion();
  }, []);

  // Cada usuario que entra registra este teléfono para sus avisos (cita nueva, su agenda).
  useEffect(() => {
    if (usuario) void avisosDeStaff();
  }, [usuario]);

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.base } }}
    />
  );
}
