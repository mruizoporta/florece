<?php

namespace App\Livewire\Forms\Dashboard\Image;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Image\CreateAction;

use App\Models\Product;

class CreateForm extends Form
{
    public ?Product $product;

    #[Rule('required|mimes:jpg,jpeg,png,webp|max:2048', as: 'imagen')]
    public $image = '';

    public function setProduct($product){
        $this->product = $product;
    }

    public function store()
    {
        $image = ImageService::upload('storage/items/', $this->image);
        CreateAction::handle($this->product->id, $image);
        $this->reset('image');
    }
}
