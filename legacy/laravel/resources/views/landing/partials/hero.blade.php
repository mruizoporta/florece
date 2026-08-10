<section class="relative overflow-hidden pt-28 lg:pt-40 pb-24 lg:pb-36 px-4 sm:px-6 lg:px-8">
    {{-- Atmósfera: capas de luz y color cálido --}}
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-base via-brand-rose-mist to-brand-peach/35"></div>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(255,210,0,0.18),transparent_55%)]"></div>
    <div class="pointer-events-none absolute -right-20 top-1/4 h-[28rem] w-[28rem] rounded-full bg-brand-peach/45 blur-3xl"></div>
    <div class="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-brand-terracotta-light/35 blur-3xl"></div>
    <div class="pointer-events-none absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-brand-primary/10 blur-2xl"></div>

    <div class="relative max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {{-- Columna izquierda: texto --}}
            <div class="order-2 lg:order-1">
                <p class="text-sm font-semibold text-brand-terracotta uppercase tracking-widest mb-6">
                    {{ __('app.hero.badge') }}
                </p>
                <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-8">
                    {{ __('app.hero.title_line1') }}<br />
                    <span class="text-brand-primary">{{ __('app.hero.title_highlight') }}</span>
                </h1>
                <p class="text-xl lg:text-2xl text-brand-ink-muted leading-relaxed mb-10 max-w-xl">
                    {{ __('app.hero.subtitle') }}
                    <span class="text-brand-ink font-medium">{{ __('app.hero.subtitle_emphasis') }}</span>.
                </p>

                <div class="space-y-6">
                    <div>
                        <a href="{{ route('register.salon') }}" wire:navigate class="inline-flex items-center justify-center w-full sm:w-auto px-10 py-5 text-lg font-semibold text-brand-primary-dark bg-brand-primary rounded-xl hover:bg-brand-primary-hover transition-all duration-200 shadow-lg shadow-brand-primary/35 hover:shadow-xl hover:shadow-brand-primary/45 hover:-translate-y-0.5">
                            {{ __('app.hero.cta_primary') }}
                        </a>
                        <div class="mt-4 space-y-1.5 max-w-lg">
                            <p class="text-sm text-brand-ink-muted leading-relaxed">{{ __('app.hero.cta_hint_demo') }}</p>
                            <p class="text-sm text-brand-ink leading-relaxed opacity-90">{{ __('app.hero.cta_hint_register') }}</p>
                        </div>
                    </div>
                    <div>
                        <a href="{{ demo_url() }}" target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-brand-ink border-2 border-brand-terracotta-light rounded-xl bg-white/80 shadow-md shadow-brand-terracotta/10 hover:border-brand-primary hover:bg-brand-primary/10 hover:shadow-lg transition-all duration-200">
                            <svg class="w-5 h-5 text-brand-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {{ __('app.hero.cta_demo') }}
                        </a>
                    </div>
                </div>
            </div>

            {{-- Columna derecha: mockup --}}
            <div class="order-1 lg:order-2 relative">
                <div class="relative lg:pl-8">
                    {{-- Glow multicapa detrás del mockup --}}
                    <div class="absolute -inset-8 rounded-[2rem] bg-gradient-to-tr from-brand-primary/25 via-brand-peach/30 to-brand-terracotta-light/20 blur-2xl -z-10"></div>
                    <div class="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-primary/15 to-transparent blur-xl -z-10"></div>

                    {{-- Browser mockup --}}
                    <div class="relative rounded-2xl border border-brand-blush-light/90 bg-white/95 shadow-2xl shadow-brand-terracotta/15 ring-1 ring-white/80 overflow-hidden backdrop-blur-sm">
                        {{-- Barra del navegador --}}
                        <div class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-blush-bg/90 to-brand-rose-mist/80 border-b border-brand-blush-light/70">
                            <div class="flex gap-1.5">
                                <span class="w-3 h-3 rounded-full bg-red-300/90"></span>
                                <span class="w-3 h-3 rounded-full bg-amber-300/90"></span>
                                <span class="w-3 h-3 rounded-full bg-emerald-300/80"></span>
                            </div>
                            <div class="flex-1 mx-8 flex justify-center">
                                <div class="flex items-center gap-2 px-4 py-1.5 bg-white/90 rounded-lg border border-brand-blush-light text-xs text-brand-ink-muted font-medium shadow-sm">
                                    <svg class="w-3.5 h-3.5 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    demo.shearly.app
                                </div>
                            </div>
                        </div>

                        {{-- Contenido del mockup: dashboard --}}
                        <div class="p-6 space-y-6 min-h-[320px] lg:min-h-[380px] bg-gradient-to-br from-brand-rose-mist/90 via-white to-brand-warm/70">
                            {{-- Stats --}}
                            <div class="grid grid-cols-3 gap-3">
                                @foreach([[__('app.hero.mock_today'), '12', 'shearly'], [__('app.hero.mock_waiting'), '3', 'gray'], [__('app.hero.mock_done'), '8', 'emerald']] as $stat)
                                <div class="p-4 rounded-xl bg-white/95 border border-brand-blush-light/70 shadow-md shadow-brand-terracotta/5">
                                    <p class="text-xs font-medium text-brand-ink-muted uppercase tracking-wider">{{ $stat[0] }}</p>
                                    <p class="text-2xl font-bold text-brand-ink mt-1">{{ $stat[1] }}</p>
                                </div>
                                @endforeach
                            </div>

                            {{-- Calendario simplificado --}}
                            <div class="p-4 rounded-xl bg-white/95 border border-brand-blush-light/70 shadow-md shadow-brand-terracotta/5">
                                <p class="text-xs font-semibold text-brand-ink uppercase tracking-wider mb-3">{{ __('app.hero.mock_agenda_title') }}</p>
                                <div class="space-y-2">
                                    @foreach([['09:00', 'María L.', __('app.hero.mock_apt1_service')], ['10:30', 'Carlos R.', __('app.hero.mock_apt2_service')], ['11:00', 'Ana G.', __('app.hero.mock_apt3_service')]] as $apt)
                                    <div class="flex items-center gap-3 py-2 px-3 rounded-lg bg-gradient-to-r from-brand-primary/15 to-brand-peach/20 border-l-4 border-brand-primary">
                                        <span class="text-sm font-mono font-medium text-brand-ink-muted w-12">{{ $apt[0] }}</span>
                                        <span class="text-sm font-medium text-brand-ink">{{ $apt[1] }}</span>
                                        <span class="text-xs text-brand-ink-muted">{{ $apt[2] }}</span>
                                    </div>
                                    @endforeach
                                </div>
                            </div>

                            {{-- CTA en el mockup --}}
                            <div class="flex justify-center py-2">
                                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-primary/25 to-brand-peach/30 text-brand-primary-dark text-sm font-medium ring-1 ring-brand-primary/20">
                                    <svg class="w-4 h-4 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    {{ __('app.hero.mock_panel_cta') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
