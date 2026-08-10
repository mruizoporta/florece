<section id="precios" class="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-rose-mist via-brand-alt/90 to-brand-peach/25"></div>
    <div class="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl"></div>

    @php
        $plansList = isset($plans) ? collect($plans) : collect();
        $pricingRegion = $pricingRegion ?? 'NI';
    @endphp

    <div class="relative max-w-6xl mx-auto">
        <div class="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-brand-terracotta mb-3">{{ __('app.pricing.heading_kicker') }}</p>
            <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink mb-4">{{ __('app.pricing.heading') }}</h2>
            <p class="text-lg text-brand-ink-muted leading-relaxed">
                {{ __('app.pricing.intro') }}
            </p>
            <p class="mt-4 text-sm text-brand-ink-muted/90 leading-relaxed border-t border-brand-blush-light/60 pt-4">
                {{ __('app.pricing.card_footnote') }}
            </p>
        </div>

        @if ($plansList->isNotEmpty())
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 mb-10 lg:mb-12">
                <span class="text-sm font-medium text-brand-ink-muted text-center sm:text-left">{{ __('app.pricing.region_selector_label') }}</span>
                <div class="inline-flex rounded-xl border border-brand-blush-light/80 bg-white/90 p-1 shadow-sm mx-auto sm:mx-0" role="group" aria-label="{{ __('app.pricing.region_selector_label') }}">
                    <button
                        type="button"
                        wire:click="choosePricingRegion('NI')"
                        class="px-4 py-2 rounded-lg text-sm font-semibold transition min-w-[9rem] {{ $pricingRegion === 'NI' ? 'bg-brand-primary text-brand-primary-dark shadow-sm' : 'text-brand-ink-muted hover:text-brand-ink hover:bg-brand-mist/80' }}"
                    >
                        {{ __('app.pricing.region_ni') }}
                    </button>
                    <button
                        type="button"
                        wire:click="choosePricingRegion('US')"
                        class="px-4 py-2 rounded-lg text-sm font-semibold transition min-w-[9rem] {{ $pricingRegion === 'US' ? 'bg-brand-primary text-brand-primary-dark shadow-sm' : 'text-brand-ink-muted hover:text-brand-ink hover:bg-brand-mist/80' }}"
                    >
                        {{ __('app.pricing.region_us') }}
                    </button>
                </div>
            </div>

            <div class="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            @foreach ($plansList as $plan)
                @php
                    $isPro = $plan->slug === 'pro';
                    $isPremium = $plan->slug === 'premium';
                    $planName = __('app.pricing.plan.' . $plan->slug);
                    $planDesc = __('app.pricing.desc.' . $plan->slug);
                    $amount = $plan->monthlyAmountForLanding($pricingRegion);
                    $priceFormatted = $amount > 0 ? '$'.number_format($amount, 0, '.', ',') : '—';
                    $registerUrl = route('register.salon', ['plan' => $plan->slug, 'region' => $pricingRegion]);
                @endphp

                <article class="relative flex h-full flex-col rounded-2xl border-2 p-6 lg:p-8 min-h-[28rem] transition-all duration-300 hover:-translate-y-1 {{ $isPro ? 'border-brand-primary bg-gradient-to-b from-white via-brand-rose-mist/90 to-white shadow-2xl shadow-brand-primary/25 ring-2 ring-brand-primary/30 z-10 md:scale-[1.03] md:-my-1' : 'border-brand-blush-light/80 bg-gradient-to-b from-white/95 to-brand-blush-bg/35 hover:border-brand-primary/35 hover:shadow-xl' }}">
                    @if ($isPro)
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-brand-primary text-brand-primary-dark text-xs font-bold uppercase tracking-wide rounded-full shadow-lg shadow-brand-primary/35">
                            {{ __('app.pricing.popular') }}
                        </div>
                    @endif

                    <header class="mb-5">
                        <h3 class="font-serif text-2xl font-semibold text-brand-ink">{{ $planName }}</h3>
                        <p class="mt-2 text-sm text-brand-ink-muted leading-relaxed">{{ $planDesc }}</p>
                    </header>

                    <div class="mb-6 rounded-xl bg-brand-mist/80 border border-brand-blush-light/50 px-4 py-5">
                        <p class="text-xs font-semibold uppercase tracking-wider text-brand-terracotta">{{ __('app.pricing.billing_cycle') }}</p>
                        <div class="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 min-h-[3.5rem]">
                            <span class="text-4xl sm:text-5xl font-bold text-brand-ink tabular-nums tracking-tight">{{ $priceFormatted }}</span>
                            <span class="text-lg sm:text-xl font-medium text-brand-ink-muted">{{ __('app.pricing.per_month') }}</span>
                        </div>
                        <p class="mt-3 text-xs text-brand-ink-muted/90 leading-snug">{{ __('app.pricing.price_compare_note') }}</p>
                    </div>

                    <div class="mb-4">
                        <p class="text-xs font-semibold uppercase tracking-wider text-brand-ink/70 mb-3">{{ __('app.pricing.features_title') }}</p>
                        <ul class="space-y-2.5">
                            @foreach ($plan->marketingFeatureLines() as $line)
                                <li class="flex items-start gap-2.5 text-sm text-brand-ink">
                                    <svg class="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                    <span>{{ $line }}</span>
                                </li>
                            @endforeach
                        </ul>
                    </div>

                    <div class="mb-6 pt-4 border-t border-brand-blush-light/60">
                        <p class="text-xs font-semibold uppercase tracking-wider text-brand-ink/70 mb-3">{{ __('app.pricing.limits_title') }}</p>
                        <ul class="space-y-2.5 text-sm text-brand-ink-muted">
                            <li class="flex items-start gap-2.5">
                                <svg class="w-5 h-5 text-brand-terracotta shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                {{ $plan->max_employees ? __('app.pricing.employees_n', ['count' => $plan->max_employees]) : __('app.pricing.employees_unlimited') }}
                            </li>
                            <li class="flex items-start gap-2.5">
                                <svg class="w-5 h-5 text-brand-terracotta shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                {{ $plan->max_services ? __('app.pricing.services_n', ['count' => $plan->max_services]) : __('app.pricing.services_unlimited') }}
                            </li>
                            <li class="flex items-start gap-2.5">
                                <svg class="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                {{ __('app.pricing.trial_with_card') }}
                            </li>
                            @if ($isPremium)
                                <li class="flex items-start gap-2.5">
                                    <svg class="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                    {{ __('app.pricing.priority_support') }}
                                </li>
                            @endif
                        </ul>
                    </div>

                    <a
                        href="{{ $registerUrl }}"
                        wire:navigate
                        class="mt-auto w-full inline-flex items-center justify-center py-3.5 px-4 text-center text-sm font-semibold rounded-xl transition {{ $isPro ? 'bg-brand-primary text-brand-primary-dark hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30' : 'bg-brand-alt text-brand-ink border border-brand-blush-light hover:border-brand-primary/50 hover:bg-brand-primary/12' }}"
                    >
                        {{ __('app.pricing.choose_plan') }}
                    </a>
                </article>
            @endforeach
            </div>
        @else
            <div class="rounded-2xl border-2 border-dashed border-brand-blush-light bg-brand-mist/50 px-6 py-12 text-center max-w-lg mx-auto">
                <p class="font-serif text-xl font-semibold text-brand-ink mb-2">{{ __('app.pricing.empty_title') }}</p>
                <p class="text-sm text-brand-ink-muted leading-relaxed">{{ __('app.pricing.empty_body') }}</p>
            </div>
        @endif
    </div>
</section>
