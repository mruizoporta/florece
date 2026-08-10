import './bootstrap';

/**
 * Livewire 3 + Vite: empaquetado manual (documentación oficial).
 * Evita la carrera entre el script clásico @livewireScripts y los módulos ES,
 * que dejaba `Alpine` sin definir al usar wire:navigate / plugins de Alpine.
 *
 * Requiere @livewireScriptConfig en el layout (sin @livewireScripts).
 */
import { Livewire } from '../../vendor/livewire/livewire/dist/livewire.esm.js';

Livewire.start();
