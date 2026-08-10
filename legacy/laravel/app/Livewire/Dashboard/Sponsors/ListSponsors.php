<?php

namespace App\Livewire\Dashboard\Sponsors;

use Livewire\Component;
use Livewire\WithPagination;
use Livewire\Attributes\On;
use App\Livewire\Traits\ImageTrait;

use Facades\App\Livewire\Actions\Dashboard\Sponsor\DeleteAction;
use Facades\App\Livewire\Actions\Dashboard\Sponsor\RestoreAction;

use App\Models\Sponsor;

class ListSponsors extends Component
{
    use ImageTrait;
    use WithPagination;

    protected $paginationTheme = 'bootstrap';

    public $search;

    public function placeholder()
    {
        return <<<'HTML'
        <div class="text-center my-5 py-5">
            <div class="spinner-grow text-dark" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
        HTML;
    }

    public function delete($sponsor_id)
    {
        DeleteAction::handle($sponsor_id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Sponsor eliminado'
        ]);
    }

    public function restore($sponsor_id)
    {
        RestoreAction::handle($sponsor_id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Sponsor restaurado'
        ]);
    }

    #[On('changed-search')]
    public function changedSearch($value)
    {
        $this->resetPage();
        $this->search = $value;
    }

    #[On('refresh-sponsors')]
    public function render()
    {
        $sponsors = Sponsor::query();

        if($this->search){
            $sponsors->where('name', 'like', '%' . $this->search . '%');
        }
        return view('livewire.dashboard.sponsors.list-sponsors')->with([
            'sponsors' => $sponsors->withTrashed()->paginate(5)
        ]);
    }
}
