<div>

    @section('pageTitle', __('app.page.title.users'))

    @section('breadcrumbs')
        <a href="{{ tenant_route('dashboard') }}" wire:navigate class="hover:text-brand-ink transition-colors">
            {{ __('app.nav.dashboard') }}
        </a>
        <span class="text-brand-blush">/</span>
        <span class="text-brand-ink font-medium">{{ __('app.page.title.users') }}</span>
    @endsection

    <livewire:dashboard.users.create-user />

    <div class="shearly-card-section">
        <div class="shearly-card-head bg-brand-warm/30">
            <div class="min-w-0">
                <h2 class="shearly-card-title mb-0">{{ __('app.page.title.users') }}</h2>
                <p class="mt-1 text-xs text-brand-ink-muted leading-snug">Administradores del salón y búsqueda por nombre o correo.</p>
            </div>
            <button type="button"
                    onclick="window.dispatchEvent(new CustomEvent('open-create-user'))"
                    class="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-dark shadow-sm shadow-brand-primary/30 transition-all hover:bg-brand-primary-hover hover:shadow-md hover:-translate-y-px shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Nuevo usuario
            </button>
        </div>

        <div class="px-5 pt-4 pb-3 md:px-6 border-b border-brand-blush-light/60">
            <livewire:dashboard.search-component lazy :placeholder="__('app.dashboard.users_search_placeholder')" />
        </div>

        <div class="p-0 md:p-0">
            <livewire:dashboard.users.list-users />
        </div>
    </div>

</div>
