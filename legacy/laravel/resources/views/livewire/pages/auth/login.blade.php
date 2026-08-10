<?php

use App\Livewire\Forms\LoginForm;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.guest')] class extends Component
{
    public LoginForm $form;

    public function mount(): void
    {
        if (request()->hasAny(['email', 'password'])) {
            $tenantQuery = request()->query('tenant');
            $params = filled($tenantQuery) ? ['tenant' => $tenantQuery] : [];
            $this->redirect(route('login', $params), navigate: false);
            return;
        }

        $tenant = \App\Models\Tenant::current();
        if ($tenant) {
            $this->form->tenant_slug = $tenant->slug;
            return;
        }

        $tenantFromQuery = request()->query('tenant');
        if (filled($tenantFromQuery)) {
            $this->form->tenant_slug = Str::lower(trim((string) $tenantFromQuery));
            return;
        }

        if (app()->environment('local')) {
            $demoTenant = \App\Models\Tenant::withoutGlobalScopes()
                ->where('slug', \App\Services\DemoTenantService::DEMO_SLUG)
                ->first();

            if ($demoTenant) {
                $this->form->tenant_slug = $demoTenant->slug;
            }
        }
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(): void
    {
        $this->form->tenant_slug = Str::lower(trim($this->form->tenant_slug));

        $this->form->validate();

        $this->form->authenticate();

        Session::regenerate();

        $user = \Auth::user();
        $tenant = $user->tenant_id ? \App\Models\Tenant::withoutGlobalScopes()->find($user->tenant_id) : null;

        if (! $tenant) {
            \Auth::logout();
            Session::invalidate();
            Session::regenerateToken();
            $this->form->addError('tenant_slug', __('app.auth.login_no_tenant'));

            return;
        }

        if ($user->hasRole('Admin')) {
            $this->redirect(tenant_url('/dashboard', $tenant), navigate: false);

            return;
        }

        if ($user->hasRole('Customer')) {
            $this->redirect(tenant_url('/', $tenant), navigate: false);

            return;
        }

        if ($user->hasRole('Final consumer')) {
            $this->redirect(tenant_url('/', $tenant), navigate: false);

            return;
        }

        \Auth::logout();
        Session::invalidate();
        Session::regenerateToken();
        $this->form->addError('email', __('app.auth.login_no_role'));
    }
}; ?>

<div>
    <header class="mb-7 sm:mb-8 text-center">
        <h1 class="font-serif text-[1.65rem] sm:text-[1.85rem] font-semibold tracking-[-0.02em] text-brand-ink">
            {{ __('app.auth.login_heading') }}
        </h1>
        <p class="mt-2.5 text-[13px] sm:text-sm text-brand-ink-muted/95 leading-relaxed tracking-wide">
            {{ __('app.auth.login_subtitle') }}
        </p>
    </header>

    <x-auth-session-status
        class="mb-6 rounded-2xl border border-emerald-100/90 bg-emerald-50/95 px-3.5 py-3 text-sm font-medium text-emerald-900/90"
        :status="session('status')"
    />

    @if ($errors->any())
        <div class="mb-6 rounded-2xl border border-red-200/90 bg-red-50/95 px-3.5 py-3 text-sm text-red-900/90" role="alert">
            <p class="font-semibold mb-1.5">{{ __('app.auth.login_errors_title') }}</p>
            <ul class="list-disc list-inside space-y-0.5 leading-relaxed">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form wire:submit.prevent="login" class="space-y-6">
        @if (!\App\Models\Tenant::current())
            <div class="space-y-2">
                <x-input-label for="tenant_slug" :value="__('app.auth.tenant_slug_label')" variant="auth" />
                <x-text-input
                    wire:model="form.tenant_slug"
                    id="tenant_slug"
                    variant="auth"
                    class="block w-full font-mono text-[14px]"
                    type="text"
                    autocomplete="organization"
                    placeholder="{{ __('app.auth.tenant_slug_placeholder') }}"
                />
                <p class="text-xs leading-relaxed text-brand-ink-muted/90">{{ __('app.auth.tenant_slug_help') }}</p>
                <x-input-error :messages="$errors->get('form.tenant_slug')" class="mt-1.5" />
            </div>
        @else
            <input type="hidden" wire:model="form.tenant_slug" />
        @endif

        <div class="space-y-2">
            <x-input-label for="email" :value="__('app.auth.email_label')" variant="auth" />
            <x-text-input
                wire:model="form.email"
                id="email"
                variant="auth"
                class="block w-full"
                type="email"
                name="email"
                required
                autofocus
                autocomplete="username"
                placeholder="{{ __('app.auth.email_placeholder') }}"
            />
            <x-input-error :messages="$errors->get('form.email')" class="mt-1.5" />
        </div>

        <div class="space-y-2">
            <div class="flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
                <x-input-label for="password" :value="__('app.auth.password_label')" variant="auth" />
                @if (Route::has('password.request'))
                    <a
                        class="shrink-0 text-[13px] font-semibold text-brand-ink/65 transition hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-sm"
                        href="{{ route('password.request') }}"
                        wire:navigate
                    >
                        {{ __('app.auth.forgot_password') }}
                    </a>
                @endif
            </div>
            <x-text-input
                wire:model="form.password"
                id="password"
                variant="auth"
                class="block w-full"
                type="password"
                name="password"
                required
                autocomplete="current-password"
            />
            <x-input-error :messages="$errors->get('form.password')" class="mt-1.5" />
        </div>

        <div class="pt-0.5">
            <label for="remember" class="group flex cursor-pointer items-start gap-3 select-none">
                <input
                    wire:model="form.remember"
                    id="remember"
                    type="checkbox"
                    class="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer rounded-[5px] border-gray-300/95 bg-white text-brand-primary-dark shadow-[0_1px_2px_rgba(29,31,36,0.05)] transition hover:border-gray-400/90 focus:ring-2 focus:ring-brand-primary/45 focus:ring-offset-2 focus:ring-offset-white"
                    name="remember"
                >
                <span class="text-sm leading-snug text-brand-ink-muted pt-px">{{ __('app.auth.remember_me') }}</span>
            </label>
        </div>

        <div class="pt-1">
            <x-auth-submit-button class="w-full">
                {{ __('app.auth.login_submit') }}
            </x-auth-submit-button>
        </div>

        @if (\App\Models\Tenant::current())
            <div class="border-t border-gray-100 pt-7 text-center">
                <p class="text-sm text-brand-ink-muted">
                    {{ __('app.auth.are_you_customer') }}
                    <a
                        href="{{ tenant_url('/register') }}"
                        wire:navigate
                        class="font-semibold text-shearly-800 underline decoration-shearly-300/70 underline-offset-[5px] transition hover:text-shearly-900 hover:decoration-shearly-600"
                    >{{ __('app.auth.register_as_customer') }}</a>
                </p>
            </div>
        @endif
    </form>
</div>
