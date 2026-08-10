<?php

namespace App\Livewire\Dashboard\Instagram;

use Livewire\Component;
use Livewire\Attributes\On;

use Facades\App\Livewire\Actions\Dashboard\Instagram\DeleteAction;

use App\Models\InstagramFeed;

class ListInstagramFeeds extends Component
{
    public function delete($id)
    {
        DeleteAction::handle($id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Feed removido'
        ]);
    }

    #[On('refresh-instagram-feeds')]
    public function render()
    {
        return view('livewire.dashboard.instagram.list-instagram-feeds')->with([
            'instagram_feeds' => InstagramFeed::all()
        ]);
    }
}
