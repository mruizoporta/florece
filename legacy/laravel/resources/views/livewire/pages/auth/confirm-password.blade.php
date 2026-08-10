<?php

use App\Providers\RouteServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.guest')] class extends Component
{
    public string $password = '';

    /**
     * Confirm the current user's password.
     */
    public function confirmPassword(): void
    {
        $this->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Auth::guard('web')->validate([
            'email' => Auth::user()->email,
            'password' => $this->password,
        ])) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        session(['auth.password_confirmed_at' => time()]);

        $this->redirect(
            session('url.intended', RouteServiceProvider::HOME),
            navigate: true
        );
    }
}; ?>

<div>
    <div class="mb-4 text-sm text-gray-600">
        {{ __('app.auth.secure_area_confirm') }}
    </div>

    <form wire:submit="confirmPassword" class="space-y-4">
        <div>
            <x-input-label for="password" :value="__('app.auth.password_label')" variant="auth" />

            <x-text-input wire:model="password"
                          id="password"
                          variant="auth"
                          class="block mt-1.5 w-full"
                          type="password"
                          name="password"
                          required autocomplete="current-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <div class="flex justify-end pt-2">
            <x-auth-submit-button>
                {{ __('app.auth.confirm_button') }}
            </x-auth-submit-button>
        </div>
    </form>
</div>
