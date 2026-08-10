@php
    $wa = config('marketing.whatsapp_url');
    $ig = config('marketing.instagram_url');
    $fb = config('marketing.facebook_url');
    $navLink = 'relative whitespace-nowrap px-2 py-2 text-sm font-medium text-brand-ink-muted hover:text-brand-ink rounded-lg transition-colors after:absolute after:left-2 after:right-2 after:bottom-0.5 after:h-0.5 after:bg-brand-primary after:scale-x-0 after:origin-center after:transition-transform after:duration-200 ease-out hover:after:scale-x-100 xl:px-3';
@endphp

<nav class="fixed top-0 left-0 right-0 z-50 bg-brand-base/95 backdrop-blur-md border-b border-brand-blush-light/80 shadow-[0_4px_24px_-8px_rgba(29,31,36,0.08)]" aria-label="{{ __('app.nav.main_label') }}">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {{-- Una fila desktop: 3 columnas [logo | nav centrado | acciones] --}}
        <div class="hidden lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:h-[4.25rem]">
            {{-- IZQUIERDA: logo (no comparte fila con flex-1 que empuje encima) --}}
            <div class="flex shrink-0 items-center justify-self-start pr-2">
                <a href="{{ url('/') }}" class="flex items-center gap-2 text-brand-ink hover:text-brand-primary-dark transition mr-2" aria-label="Shearly — {{ __('app.meta.landing_title') }}">
                    <x-shearly-logo class="w-9 h-9 shrink-0 text-brand-primary" />
                    <span class="font-serif text-xl font-semibold tracking-tight">Shearly</span>
                </a>
            </div>

            {{-- CENTRO: máximo 5 enlaces --}}
            <nav class="flex min-w-0 items-center justify-center gap-0.5 xl:gap-1">
                <a href="#beneficios" class="{{ $navLink }}">{{ __('app.nav.benefits') }}</a>
                <a href="#modulos" class="{{ $navLink }}">{{ __('app.nav.modules') }}</a>
                <a href="#como-funciona" class="{{ $navLink }}">{{ __('app.nav.how') }}</a>
                <a href="#precios" class="{{ $navLink }}">{{ __('app.nav.pricing') }}</a>
                <a href="#faq" class="{{ $navLink }}">{{ __('app.nav.faq') }}</a>
            </nav>

            {{-- DERECHA: idioma, demo, login, CTA, WhatsApp, redes --}}
            <div class="flex shrink-0 items-center justify-end gap-1.5 xl:gap-2">
                <x-language-switch variant="landing-pill" />

                <a href="{{ demo_url() }}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-sm font-semibold text-brand-ink shadow-sm transition-all duration-200 hover:border-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary-dark"
                   aria-label="{{ __('app.nav.demo') }}">
                    <svg class="h-4 w-4 shrink-0 text-brand-primary-dark" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span class="hidden 2xl:inline">{{ __('app.nav.demo') }}</span>
                    <span class="2xl:hidden">{{ __('app.nav.demo_short') }}</span>
                </a>

                @auth
                    <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="shrink-0 px-2 py-2 text-sm font-medium text-brand-ink-muted transition hover:text-brand-ink">
                        {{ __('app.nav.dashboard') }}
                    </a>
                @else
                    <a href="{{ route('login') }}" wire:navigate class="shrink-0 px-2 py-2 text-sm font-medium text-brand-ink-muted transition hover:text-brand-ink">
                        {{ __('app.nav.login') }}
                    </a>
                @endauth

                @guest
                    <a href="{{ route('register.salon') }}" wire:navigate
                       class="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#FFD200] px-4 py-2.5 text-sm font-semibold text-brand-primary-dark shadow-lg shadow-[#FFD200]/35 transition-all duration-200 hover:bg-[#E6BD00] hover:shadow-xl hover:shadow-[#E6BD00]/40"
                       aria-label="{{ __('app.nav.create_salon') }}">
                        {{ __('app.nav.create_salon') }}
                    </a>
                @endguest

                <span class="hidden xl:inline-block h-7 w-px shrink-0 bg-gray-200/90" aria-hidden="true"></span>

                <a href="{{ $wa }}" target="_blank" rel="noopener noreferrer"
                   class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#128C7E] transition hover:bg-[#25D366]/10"
                   aria-label="{{ __('app.nav.whatsapp') }}">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>

                <div class="flex items-center gap-0.5 pl-0.5">
                    <a href="{{ $ig }}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink-muted transition hover:bg-brand-primary/10 hover:text-brand-primary-dark" aria-label="{{ __('app.social.instagram') }}">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="{{ $fb }}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink-muted transition hover:bg-brand-primary/10 hover:text-brand-primary-dark" aria-label="{{ __('app.social.facebook') }}">
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                </div>
            </div>
        </div>

        {{-- Mobile / tablet: logo | CTA + menú --}}
        <div class="flex h-16 items-center justify-between gap-3 lg:hidden">
            <a href="{{ url('/') }}" class="flex min-w-0 shrink items-center gap-2 text-brand-ink hover:text-brand-primary-dark transition" aria-label="Shearly — {{ __('app.meta.landing_title') }}">
                <x-shearly-logo class="h-9 w-9 shrink-0 text-brand-primary" />
                <span class="truncate font-serif text-xl font-semibold tracking-tight">Shearly</span>
            </a>

            <div class="flex shrink-0 items-center gap-2">
                @guest
                    <a href="{{ route('register.salon') }}" wire:navigate
                       class="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-[#FFD200] px-4 py-2.5 text-sm font-semibold text-brand-primary-dark shadow-md shadow-[#FFD200]/30 transition hover:bg-[#E6BD00]"
                       aria-label="{{ __('app.nav.create_salon') }}">
                        {{ __('app.nav.create_salon_short') }}
                    </a>
                @endguest

                <details class="group relative">
                    <summary class="flex cursor-pointer list-none items-center justify-center rounded-xl border-2 border-gray-200 p-2.5 text-brand-ink transition hover:border-brand-primary hover:bg-brand-primary/5 [&::-webkit-details-marker]:hidden">
                        <span class="sr-only">{{ __('app.nav.open_menu') }}</span>
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </summary>
                    <div class="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-brand-blush-light/40 bg-brand-base shadow-xl shadow-brand-ink/5">
                        <div class="mx-auto max-w-7xl space-y-1 px-4 py-5">
                            <a href="#beneficios" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.benefits') }}</a>
                            <a href="#modulos" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.modules') }}</a>
                            <a href="#como-funciona" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.how') }}</a>
                            <a href="#precios" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.pricing') }}</a>
                            <a href="#faq" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.faq') }}</a>
                            <a href="#impacto" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.growth') }}</a>
                            <a href="#contacto" class="block rounded-xl px-4 py-3 text-base font-medium text-brand-ink hover:bg-brand-warm/80">{{ __('app.nav.contact') }}</a>

                            <div class="mt-4 space-y-3 border-t border-gray-100 pt-4">
                                <x-language-switch variant="landing-pill" class="justify-center" />
                                <a href="{{ demo_url() }}" target="_blank" rel="noopener noreferrer" class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-ink/12 px-4 py-3 font-semibold text-brand-ink hover:border-brand-primary">
                                    <svg class="h-4 w-4 text-brand-primary-dark" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    {{ __('app.nav.demo') }}
                                </a>
                                @auth
                                    <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="block py-3 text-center font-medium text-brand-ink-muted">{{ __('app.nav.dashboard') }}</a>
                                @else
                                    <a href="{{ route('login') }}" wire:navigate class="block py-3 text-center font-medium text-brand-ink-muted">{{ __('app.nav.login') }}</a>
                                @endauth
                                <div class="flex items-center justify-center gap-4 pt-2">
                                    <a href="{{ $wa }}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E]" aria-label="{{ __('app.nav.whatsapp') }}">
                                        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        {{ __('app.nav.whatsapp') }}
                                    </a>
                                    <a href="{{ $ig }}" target="_blank" rel="noopener noreferrer" class="rounded-lg p-2 text-brand-ink-muted hover:bg-brand-warm/80" aria-label="{{ __('app.social.instagram') }}">
                                        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                    </a>
                                    <a href="{{ $fb }}" target="_blank" rel="noopener noreferrer" class="rounded-lg p-2 text-brand-ink-muted hover:bg-brand-warm/80" aria-label="{{ __('app.social.facebook') }}">
                                        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    </div>
</nav>
