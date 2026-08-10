<div>
    @if($isDemo ?? false)
        <div class="fixed top-0 left-0 right-0 z-[60] bg-brand-warm/95 border-b border-brand-blush-light/80 px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-sm text-brand-ink text-center backdrop-blur-sm">
            <span class="font-medium">{{ __('app.demo.banner') }}</span>
            <a href="{{ route('register.salon') }}" wire:navigate
               class="inline-flex items-center px-4 py-2 rounded-xl font-semibold
                      bg-brand-primary text-brand-primary-dark border border-brand-primary/40
                      shadow-sm shadow-brand-primary/25 hover:bg-brand-primary-hover transition">
                {{ __('app.demo.cta_create_salon') }}
            </a>
        </div>
    @endif

    <nav class="fixed {{ ($isDemo ?? false) ? 'top-[52px]' : 'top-0' }} left-0 right-0 z-50
                bg-brand-base/95 backdrop-blur-md border-b border-brand-blush-light/80
                shadow-[0_4px_24px_-12px_rgba(29,31,36,0.08)]">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16 lg:h-20 gap-4">
                <a href="{{ tenant_url('/') }}" class="flex items-center gap-3 min-w-0">
                    @if($setting && $setting->logo && !in_array($setting->logo, ['your-logo.png', 'placeholder.webp']))
                        <img src="{{ asset('storage/logo/128/' . $setting->logo) }}" alt="" class="h-9 w-9 object-contain flex-shrink-0" onerror="this.style.display='none'">
                    @endif
                    <span class="font-serif text-xl font-semibold text-brand-ink truncate">{{ $setting->company_name ?? __('app.meta.salon_default') }}</span>
                </a>

                <div class="flex items-center gap-3 sm:gap-4 shrink-0">
                    <x-language-switch variant="landing-pill" />
                    <a href="{{ tenant_url('/') }}"
                       class="hidden sm:inline-flex text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition py-2 px-3 rounded-xl hover:bg-brand-warm">
                        {{ __('app.booking.back_home') }}
                    </a>
                    @auth
                        <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition py-2">{{ __('app.nav.dashboard') }}</a>
                    @else
                        <a href="{{ tenant_url('/login') }}" wire:navigate
                           class="text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition py-2 px-3 rounded-xl hover:bg-brand-warm">{{ __('app.nav.login') }}</a>
                    @endauth
                </div>
            </div>
        </div>
    </nav>

    <section class="relative overflow-hidden {{ ($isDemo ?? false) ? 'pt-[calc(5.5rem+52px)] lg:pt-[calc(6.5rem+52px)]' : 'pt-28 lg:pt-32' }} pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div class="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-brand-peach/40 blur-3xl"></div>
            <div class="absolute bottom-20 left-[-8%] h-64 w-64 rounded-full bg-brand-primary/15 blur-3xl"></div>
        </div>

        <div class="max-w-3xl mx-auto">
            <div class="mb-10 text-center">
                <p class="text-sm font-semibold uppercase tracking-wider text-brand-ink-muted mb-2">{{ __('app.salon.book') }}</p>
                <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink tracking-tight">
                    {{ $setting->company_name ?? __('app.meta.salon_default') }}
                </h1>
            </div>

            @if($setting->active_appointment)
                @include('livewire.frontend.appointments.create-appointment')
            @else
                <div class="rounded-2xl border border-brand-blush-light/80 bg-white/80 backdrop-blur-sm p-8 sm:p-10 text-center shadow-[0_8px_40px_-20px_rgba(29,31,36,0.12)]">
                    <h2 class="font-serif text-2xl font-semibold text-brand-ink mb-3">{{ __('app.booking.inactive_title') }}</h2>
                    <p class="text-brand-ink-muted mb-8">{{ __('app.booking.inactive_body') }}</p>
                    <a href="{{ tenant_url('/') }}"
                       class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold
                              text-brand-primary-dark bg-brand-primary hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/25">
                        {{ __('app.booking.back_home') }}
                    </a>
                </div>
            @endif
        </div>
    </section>
</div>
