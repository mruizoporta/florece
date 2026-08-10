<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class SearchComponent extends Component
{
    public string $search = '';

    /** @var string Placeholder del campo de búsqueda (p. ej. por pantalla). */
    public string $placeholder = 'Buscar por cliente, servicio...';

    public function updatedSearch()
    {
        $this->dispatch('changed-search', $this->search);
    }
}
