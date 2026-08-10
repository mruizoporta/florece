<?php

namespace App\Livewire\Forms\Dashboard\Sponsor;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Illuminate\Support\Facades\Validator;

use Facades\App\Livewire\Services\Dashboard\ImageService;

use Facades\App\Livewire\Actions\Dashboard\Sponsor\UpdateAction;

use App\Models\Sponsor;

class UpdateForm extends Form
{
    public ?Sponsor $sponsor;

    public string $name = '';

    public $image = '';

    public $currentImage;

    public function rules()
    {
        return [
            'name' => 'required|max:75|unique:sponsors,name,' . $this->sponsor->id,
            'image' => 'nullable|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    public function validationAttributes()
    {
        return [
            'name' => 'nombre',
            'image' => 'image'
        ];
    }

    public function setSponsor($sponsor)
    {
        $this->sponsor = $sponsor;
        $this->name = $sponsor->name;
        $this->currentImage = $sponsor->image;
    }

    public function update()
    {
        $image = $this->sponsor->image;

        if($this->image){
            $image = ImageService::upload('storage/sponsors/', $this->image);
        }

        UpdateAction::handle($this->sponsor->id, $this->name, $image);

        $this->reset();
    }
}
