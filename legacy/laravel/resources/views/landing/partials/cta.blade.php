<section class="relative py-20 lg:py-28 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-brand-ink via-[#252830] to-[#1a1c22]">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,210,0,0.16),_transparent_55%)]"></div>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(232,180,168,0.12),_transparent_50%)]"></div>
    <div class="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-y-1/3 rounded-full bg-brand-terracotta/10 blur-3xl"></div>

    <div class="relative max-w-3xl mx-auto text-center">
        <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-white mb-4">
            {{ __('app.cta.heading') }}
        </h2>
        <p class="text-lg text-gray-300 mb-6 leading-relaxed">
            {{ __('app.cta.body1') }}
        </p>
        <p class="text-gray-400 text-sm font-medium mb-10">{{ __('app.cta.body2') }}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="{{ route('register.salon') }}" wire:navigate
                class="inline-flex items-center justify-center px-10 py-4 text-base font-semibold text-brand-primary-dark bg-brand-primary rounded-xl hover:bg-brand-primary-hover transition shadow-lg shadow-brand-primary/35 hover:shadow-xl hover:shadow-brand-primary/45 w-full sm:w-auto">
                {{ __('app.cta.button') }}
            </a>
            <a href="{{ demo_url() }}" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/25 rounded-xl hover:border-brand-primary/70 hover:bg-white/10 transition w-full sm:w-auto">
                <svg class="w-5 h-5 text-brand-primary shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                {{ __('app.nav.demo') }}
            </a>
        </div>
    </div>
</section>
