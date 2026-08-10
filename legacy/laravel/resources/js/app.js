import './bootstrap';

/**
 * Alpine.js viene integrado en el bundle de Livewire (@livewireScripts).
 * No importar el paquete npm `alpinejs` aquí: el script de Vite es `type="module"`
 * y se ejecuta después de `livewire.js`; asignar `window.Alpine` de nuevo rompe
 * plugins y el arranque y puede provocar "Alpine is not defined" en otros puntos.
 *
 * Si en el futuro necesitas plugins de Alpine, usa el modo "manual bundling" de
 * Livewire (@livewireScriptConfig + import desde livewire.esm).
 */
