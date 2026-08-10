<?php

namespace App\Livewire\Dashboard\Images;

use Livewire\Component;
use Livewire\Attributes\On;
use App\Livewire\Traits\ImageTrait;

use Facades\App\Livewire\Actions\Dashboard\Image\DeleteAction;


use App\Models\Image;

class ListImages extends Component
{
    use ImageTrait;

    public $product;

    public function mount($product)
    {
        $this->product = $product;
    }

    public function delete($image_id)
    {
        DeleteAction::handle($image_id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Imagen removida'
        ]);
    }

    public function reorderImages($list)
    {
        dd($list);
        foreach ($list as $index => $item) {
            Image::find($item['value'])->update(['order' => $index + 1]);
        }
    }

    #[On('refresh-images')]
    public function render()
    {
        return view('livewire.dashboard.images.list-images')->with([
            'images' => Image::where('product_id', $this->product->id)
                ->orderBy('order', 'asc')
                ->get()
        ]);
    }
}
