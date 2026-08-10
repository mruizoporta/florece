<section id="como-funciona" class="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-terracotta-muted/50 via-brand-mist to-brand-rose-mist"></div>
    <div class="pointer-events-none absolute left-1/2 top-0 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent"></div>

    <div class="relative max-w-4xl mx-auto">
        <div class="text-center mb-16">
            <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink mb-4">{{ __('app.how.heading') }}</h2>
            <p class="text-lg text-brand-ink-muted max-w-xl mx-auto">{{ __('app.how.subtitle') }}</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div class="relative">
                <div class="flex flex-col items-center text-center rounded-2xl border border-brand-blush-light/60 bg-white/50 px-4 py-6 shadow-md shadow-brand-terracotta/5 backdrop-blur-sm">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-brand-primary-dark flex items-center justify-center text-xl font-serif font-bold mb-4 shadow-lg shadow-brand-primary/35 ring-4 ring-brand-peach/40">1</div>
                    <h3 class="font-semibold text-brand-ink mb-2">{{ __('app.how.step1_title') }}</h3>
                    <p class="text-brand-ink-muted text-sm">{{ __('app.how.step1_body') }}</p>
                </div>
                <div class="hidden md:block absolute top-12 left-[58%] w-[85%] h-0.5 bg-gradient-to-r from-brand-primary/50 via-brand-peach/70 to-brand-blush-light"></div>
            </div>
            <div class="relative">
                <div class="flex flex-col items-center text-center rounded-2xl border border-brand-blush-light/60 bg-white/50 px-4 py-6 shadow-md shadow-brand-terracotta/5 backdrop-blur-sm">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-brand-primary-dark flex items-center justify-center text-xl font-serif font-bold mb-4 shadow-lg shadow-brand-primary/35 ring-4 ring-brand-peach/40">2</div>
                    <h3 class="font-semibold text-brand-ink mb-2">{{ __('app.how.step2_title') }}</h3>
                    <p class="text-brand-ink-muted text-sm">{{ __('app.how.step2_body') }}</p>
                </div>
                <div class="hidden md:block absolute top-12 left-[58%] w-[85%] h-0.5 bg-gradient-to-r from-brand-primary/50 via-brand-peach/70 to-brand-blush-light"></div>
            </div>
            <div>
                <div class="flex flex-col items-center text-center rounded-2xl border border-brand-blush-light/60 bg-white/50 px-4 py-6 shadow-md shadow-brand-terracotta/5 backdrop-blur-sm">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-brand-primary-dark flex items-center justify-center text-xl font-serif font-bold mb-4 shadow-lg shadow-brand-primary/35 ring-4 ring-brand-peach/40">3</div>
                    <h3 class="font-semibold text-brand-ink mb-2">{{ __('app.how.step3_title') }}</h3>
                    <p class="text-brand-ink-muted text-sm">{{ __('app.how.step3_body') }}</p>
                </div>
            </div>
        </div>

        <p class="text-center mt-12 text-sm text-brand-ink-muted font-medium max-w-2xl mx-auto leading-relaxed">
            {{ __('app.how.footer_note') }}
        </p>
    </div>
</section>
