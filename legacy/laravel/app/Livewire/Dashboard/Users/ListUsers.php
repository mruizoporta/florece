<?php

namespace App\Livewire\Dashboard\Users;

use Livewire\Component;
use Livewire\WithPagination;
use Livewire\Attributes\On;

use Facades\App\Livewire\Actions\Dashboard\User\ResetPasswordAction;

use App\Models\User;

class ListUsers extends Component
{
    use WithPagination;

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

    #[On('changed-search')]
    public function changedSearch($value)
    {
        $this->resetPage();
        $this->search = $value;
    }

    public function resetPassword($user_id)
    {
        ResetPasswordAction::handle($user_id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Se restauró la contraseña a *1234*'
        ]);
    }

    #[On('refresh-users')]
    public function render()
    {
        $users = User::query()
            ->with('roles')
            ->where('tenant_id', \App\Models\Tenant::current()?->id);

        if ($this->search) {
            $term = '%' . $this->search . '%';
            $users->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        return view('livewire.dashboard.users.list-users')->with([
            'users' => $users->orderBy('name')->orderBy('id')->paginate(5),
        ]);
    }
}
