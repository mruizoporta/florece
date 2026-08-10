<?php

use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

use App\Models\Customer;

use Facades\App\Livewire\Actions\Frontend\Customer\CreateAction;
use Facades\App\Livewire\Actions\Frontend\User\AssignCustomerRoleAction;

new #[Layout('layouts.guest')] class extends Component
{
    public string $name = '';
    public string $email = '';
    public string $password = '';
    public string $password_confirmation = '';

    /**
     * Handle an incoming registration request.
     */
    public function register(): void
    {
        $tenant = \App\Models\Tenant::current();
        if (! $tenant) {
            throw new \Illuminate\Validation\ValidationException(validator([], []), redirect('/login'), ['tenant' => [__('app.register_salon.tenant_required')]]);
        }

        $validated = $this->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique('users', 'email')->where('tenant_id', $tenant->id),
            ],
            'password' => ['required', 'string', 'confirmed', Rules\Password::defaults()],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['tenant_id'] = $tenant->id;

        event(new Registered($user = User::create($validated)));

        // Create a customer row
        CreateAction::handle($user->id);

        // Assign role
        AssignCustomerRoleAction::handle($user->id);

        Auth::login($user);

        $this->redirect(tenant_url('/', $tenant), navigate: false);

        //$this->redirect(RouteServiceProvider::HOME, navigate: true);
    }
}; ?>

<div>
    <form wire:submit="register" class="space-y-4">
        <div>
            <x-input-label for="name" :value="__('app.auth.name_label')" variant="auth" />
            <x-text-input wire:model="name" id="name" variant="auth" class="block mt-1.5 w-full" type="text" name="name" required autofocus autocomplete="name" />
            <x-input-error :messages="$errors->get('name')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="email" :value="__('app.auth.email_label')" variant="auth" />
            <x-text-input wire:model="email" id="email" variant="auth" class="block mt-1.5 w-full" type="email" name="email" required autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="password" :value="__('app.auth.password_label')" variant="auth" />

            <x-text-input wire:model="password" id="password" variant="auth" class="block mt-1.5 w-full"
                            type="password"
                            name="password"
                            required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="password_confirmation" :value="__('app.auth.confirm_password_label')" variant="auth" />

            <x-text-input wire:model="password_confirmation" id="password_confirmation" variant="auth" class="block mt-1.5 w-full"
                            type="password"
                            name="password_confirmation" required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
        </div>

        <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-2">
            <a class="text-sm text-gray-500 underline underline-offset-2 hover:text-shearly-800 text-center sm:text-left" href="{{ route('login') }}" wire:navigate>
                {{ __('app.auth.already_registered_link') }}
            </a>

            <x-auth-submit-button class="w-full sm:w-auto">
                {{ __('app.auth.register_customer_submit') }}
            </x-auth-submit-button>
        </div>
    </form>
</div>
