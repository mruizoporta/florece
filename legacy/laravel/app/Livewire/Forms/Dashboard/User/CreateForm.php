<?php

namespace App\Livewire\Forms\Dashboard\User;

use App\Models\User;
use Illuminate\Validation\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\User\CreateAction;
use Facades\App\Livewire\Actions\Dashboard\User\AssignRoleAdminAction;

class CreateForm extends Form
{
    public ?User $user = null;

    public string $name = '';

    public string $email = '';

    public string $password = '';

    protected function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:75'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->where('tenant_id', \App\Models\Tenant::current()?->id),
            ],
            'password' => ['required', 'min:6', 'max:75'],
        ];
    }

    protected function validationAttributes(): array
    {
        return [
            'name' => 'nombre',
            'email' => 'correo',
            'password' => 'contraseña',
        ];
    }

    public function store(): void
    {
        $this->validate();

        $user = CreateAction::handle($this->name, $this->email, $this->password);
        AssignRoleAdminAction::handle($user->id);
        $this->reset();
    }
}
