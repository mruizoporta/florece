<?php

namespace App\Livewire\Forms;

use App\Models\Tenant;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Rule;
use Livewire\Form;

class LoginForm extends Form
{
    #[Rule('required|string|max:80|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/')]
    public string $tenant_slug = '';

    #[Rule('required|string|email')]
    public string $email = '';

    #[Rule('required|string')]
    public string $password = '';

    #[Rule('boolean')]
    public bool $remember = false;

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $this->tenant_slug = trim($this->tenant_slug);

        $credentials = $this->only(['email', 'password']);

        if (! filled($this->tenant_slug)) {
            throw ValidationException::withMessages([
                'form.tenant_slug' => __('Indica el código de tu salón (ej: mi-peluqueria).'),
            ]);
        }

        $tenant = Tenant::query()->where('slug', $this->tenant_slug)->first();
        if (! $tenant) {
            throw ValidationException::withMessages([
                'form.tenant_slug' => __('No encontramos un salón con ese código.'),
            ]);
        }

        $tenantId = $tenant->id;

        $credentials['tenant_id'] = $tenantId;

        if (! Auth::attempt($credentials, $this->remember)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'form.email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the authentication request is not rate limited.
     */
    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout(request()));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'form.email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the authentication rate limiting throttle key.
     */
    protected function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->email).'|'.$this->tenant_slug.'|'.request()->ip());
    }
}
