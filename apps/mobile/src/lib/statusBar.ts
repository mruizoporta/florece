import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';

/** Cada pantalla fija su barra de estado al enfocarse (sin limpiar: el orden blur/focus no es fiable). */
export function useStatusBar(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
