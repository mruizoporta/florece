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

    {{-- Nav --}}
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

                <div class="hidden md:flex items-center gap-8 flex-1 justify-center">
                    <a href="#servicios" class="text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition">{{ __('app.salon.nav_services') }}</a>
                    @if($showProducts && $products->isNotEmpty())
                        <a href="#productos" class="text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition">{{ __('app.salon.nav_products') }}</a>
                    @endif
                    @if($showEmployees && $employees->isNotEmpty())
                        <a href="#equipo" class="text-sm font-medium text-brand-ink-muted hover:text-brand-ink transition">{{ __('app.salon.nav_team') }}</a>
                    @endif
                    <a href="{{ tenant_url('/nueva-agenda') }}"
                       class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold
                              text-brand-primary-dark bg-brand-primary rounded-xl
                              hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/30">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {{ __('app.salon.book') }}
                    </a>
                </div>

                <div class="flex items-center gap-3 sm:gap-4 shrink-0">
                    <x-language-switch variant="landing-pill" />
                    <a href="{{ tenant_url('/nueva-agenda') }}"
                       class="md:hidden inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold
                              text-brand-primary-dark bg-brand-primary rounded-xl hover:bg-brand-primary-hover transition">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {{ __('app.salon.book_short') }}
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

    {{-- Hero --}}
    <section class="relative overflow-hidden {{ ($isDemo ?? false) ? 'pt-[calc(7rem+52px)] lg:pt-[calc(9rem+52px)]' : 'pt-28 lg:pt-36' }} pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8 min-h-[60vh] flex items-center">
        <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div class="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-brand-peach/50 blur-3xl"></div>
            <div class="absolute bottom-0 left-[-8%] h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl"></div>
        </div>
        <div class="max-w-6xl mx-auto w-full">
            <div class="max-w-2xl">
                <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-brand-ink leading-tight mb-6 tracking-tight">
                    {{ $setting->company_name ?? __('app.salon.welcome') }}
                </h1>
                @if($setting && $setting->about_us)
                    <p class="text-xl text-brand-ink-muted mb-8 max-w-xl leading-relaxed">
                        {{ Str::limit(strip_tags($setting->about_us), 200) }}
                    </p>
                @endif
                <a href="{{ tenant_url('/nueva-agenda') }}"
                    class="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold
                           text-brand-primary-dark bg-brand-primary rounded-xl
                           hover:bg-brand-primary-hover transition shadow-lg shadow-brand-primary/35">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {{ __('app.salon.book') }}
                </a>
            </div>
        </div>
    </section>

    {{-- Servicios --}}
    @if((!$section || $section->services_show_section) && $services->isNotEmpty())
    <section id="servicios" class="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-16">
                <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink mb-4">
                    {{ $section->services_text ?? 'Nuestros servicios' }}
                </h2>
                <p class="text-lg text-brand-ink-muted max-w-2xl mx-auto">{{ __('app.salon.services_subtitle') }}</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                @foreach($services as $service)
                <div class="group bg-brand-base/90 rounded-2xl shadow-md border border-brand-blush-light/70 overflow-hidden
                            hover:shadow-xl hover:shadow-brand-primary/10 hover:border-brand-primary/35 transition-all duration-300 flex flex-col">
                    <div class="h-36 bg-gradient-to-br from-brand-rose-mist to-brand-peach/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                        @php
                            $img = $service->item->image;
                            $isPlaceholder = in_array($img ?? '', ['placeholder.webp', 'your-logo.png']);
                        @endphp
                        @if($img && !$isPlaceholder)
                            <img src="{{ asset('storage/items/512/' . $img) }}" alt="{{ $service->item->name }}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" onerror="this.outerHTML='<div class=\'flex items-center justify-center w-full h-full\'><svg class=\'w-14 h-14 text-brand-terracotta\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z\'/></svg></div>'">
                        @else
                            <svg class="w-14 h-14 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
                        @endif
                    </div>
                    <div class="p-5 flex flex-col flex-1">
                        <h3 class="font-semibold text-lg text-brand-ink mb-1">{{ $service->item->name }}</h3>
                        <p class="text-brand-ink-muted text-sm mb-2">{{ $service->duration_time ?? 0 }} {{ __('app.salon.min_suffix') }}</p>
                        <p class="text-brand-terracotta font-semibold text-lg mb-4">{{ $setting->currency_symbol ?? '' }} {{ number_format($service->item->price, 2) }}</p>
                        <a href="{{ tenant_url('/nueva-agenda') }}?service={{ $service->id }}"
                            class="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold
                                   text-brand-primary-dark bg-brand-primary rounded-xl hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/25">
                            {{ __('app.salon.book') }}
                        </a>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </section>
    @endif

    {{-- Equipo --}}
    @if($showEmployees && $employees->isNotEmpty())
    <section id="equipo" class="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-brand-warm/60">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
                <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink mb-4">
                    {{ $section->employees_text ?? 'Nuestro equipo' }}
                </h2>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
                @foreach($employees as $employee)
                <div class="text-center p-6 rounded-2xl bg-brand-base shadow-sm border border-brand-blush-light/70 hover:shadow-md hover:border-brand-primary/30 transition-all duration-300">
                    <div class="w-32 h-32 mx-auto mb-4 rounded-full bg-brand-rose-mist overflow-hidden flex items-center justify-center ring-2 ring-brand-blush-light/80">
                        @if($employee->image)
                            <img src="{{ asset('storage/employees/300/' . $employee->image) }}" alt="{{ $employee->name }}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="w-full h-full bg-brand-peach/50 flex items-center justify-center" style="display:none">
                                <span class="text-2xl font-serif font-semibold text-brand-terracotta">{{ Str::substr($employee->name, 0, 1) }}</span>
                            </div>
                        @else
                            <span class="text-2xl font-serif font-semibold text-brand-terracotta">{{ Str::substr($employee->name, 0, 1) }}</span>
                        @endif
                    </div>
                    <h3 class="font-semibold text-lg text-brand-ink">{{ $employee->name }}</h3>
                    @if($employee->description)
                        <p class="text-brand-ink-muted text-sm mt-1">{{ $employee->description }}</p>
                    @endif
                </div>
                @endforeach
            </div>
        </div>
    </section>
    @endif

    {{-- Productos --}}
    @if($showProducts && $products->isNotEmpty())
    <section id="productos" class="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-brand-mist/50">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-16">
                <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-brand-ink mb-4">
                    {{ $section->products_text ?? 'Nuestros productos' }}
                </h2>
                <p class="text-lg text-brand-ink-muted max-w-2xl mx-auto">{{ __('app.salon.products_subtitle') }}</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                @foreach($products as $product)
                <div wire:key="product-{{ $product->id }}" class="group bg-brand-base rounded-2xl shadow-md border border-brand-blush-light/70 overflow-hidden
                            hover:shadow-xl hover:shadow-brand-primary/10 hover:border-brand-primary/35 transition-all duration-300 flex flex-col">
                    <button type="button" wire:click="selectProduct({{ $product->id }})" class="text-left flex-1 flex flex-col">
                        <div class="h-40 bg-gradient-to-br from-brand-rose-mist to-brand-peach/35 flex items-center justify-center overflow-hidden flex-shrink-0">
                            @php
                                $img = $product->item->image ?? null;
                                $isPlaceholder = $img && in_array($img, ['placeholder.webp', 'your-logo.png']);
                            @endphp
                            @if($img && !$isPlaceholder)
                                <img src="{{ asset('storage/items/512/' . $img) }}" alt="{{ $product->item->name }}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                            @else
                                <svg class="w-12 h-12 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            @endif
                        </div>
                        <div class="p-4 flex flex-col flex-1">
                            <h3 class="font-semibold text-brand-ink mb-1">{{ $product->item->name }}</h3>
                            <p class="text-brand-terracotta font-semibold">{{ $setting->currency_symbol ?? '' }} {{ number_format($product->item->price, 2) }}</p>
                            @if($product->stock > 0)
                                <p class="text-brand-ink-muted/70 text-xs mt-1">{{ $product->stock }} {{ $product->stock === 1 ? __('app.salon.unit') : __('app.salon.units') }}</p>
                            @else
                                <p class="text-amber-700 text-xs mt-1">{{ __('app.salon.out_of_stock') }}</p>
                            @endif
                        </div>
                    </button>
                </div>
                @endforeach
            </div>
        </div>
    </section>
    @endif

    {{-- Modal producto --}}
    @if($selectedProduct)
    <div class="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-producto" role="dialog" aria-modal="true">
        <div class="flex min-h-full items-center justify-center p-4">
            <div class="fixed inset-0 bg-brand-ink/50 backdrop-blur-sm transition-opacity" wire:click="clearProduct"></div>
            <div class="relative bg-brand-base rounded-2xl shadow-xl border border-brand-blush-light/80 max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <button type="button" wire:click="clearProduct" class="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-base/90 shadow hover:bg-brand-warm transition">
                    <svg class="w-5 h-5 text-brand-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <div class="overflow-y-auto max-h-[90vh] p-6 sm:p-8">
                    <div class="grid sm:grid-cols-2 gap-6">
                        <div class="aspect-square rounded-xl overflow-hidden bg-brand-rose-mist">
                            @if($selectedProduct->item->image && !in_array($selectedProduct->item->image, ['placeholder.webp', 'your-logo.png']))
                                <img src="{{ asset('storage/items/512/' . $selectedProduct->item->image) }}" alt="{{ $selectedProduct->item->name }}" class="w-full h-full object-cover">
                            @else
                                <div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-20 h-20 text-brand-terracotta/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                </div>
                            @endif
                        </div>
                        <div>
                            <h3 class="font-serif text-2xl font-semibold text-brand-ink mb-2">{{ $selectedProduct->item->name }}</h3>
                            <p class="text-brand-terracotta font-semibold text-xl mb-3">{{ $selectedProduct->item->price_formatted }}</p>
                            @if($selectedProduct->item->description)
                                <p class="text-brand-ink-muted mb-4">{{ $selectedProduct->item->description }}</p>
                            @endif
                            <p class="text-sm text-brand-ink-muted mb-4">
                                {{ $selectedProduct->item->category->name ?? '' }}
                                · {{ $selectedProduct->stock > 0 ? $selectedProduct->stock . ' ' . ($selectedProduct->stock === 1 ? __('app.salon.unit') : __('app.salon.units')) : __('app.salon.out_of_stock') }}
                            </p>
                            @if($setting->whatsapp)
                                <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $setting->whatsapp) }}?text={{ urlencode(__('app.salon.whatsapp_product_query', ['product' => $selectedProduct->item->name])) }}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#25D366] rounded-xl hover:opacity-90 transition">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    {{ __('app.salon.whatsapp_cta') }}
                                </a>
                            @endif
                        </div>
                    </div>
                    @if($selectedProduct->long_description)
                        <div class="mt-6 pt-6 border-t border-brand-blush-light/70">
                            <h4 class="font-semibold text-brand-ink mb-2">{{ __('app.salon.details') }}</h4>
                            <div class="prose prose-sm text-brand-ink-muted max-w-none">{!! $selectedProduct->long_description !!}</div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
    @endif

    {{-- CTA --}}
    <section class="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-ink via-[#252830] to-[#1a1c22]">
        <div class="max-w-3xl mx-auto text-center">
            <h2 class="font-serif text-3xl sm:text-4xl font-semibold text-white mb-4">
                {{ __('app.salon.cta_ready') }}
            </h2>
            <p class="text-lg text-gray-300 mb-8">
                {{ __('app.salon.cta_sub') }}
            </p>
            <a href="{{ tenant_url('/nueva-agenda') }}"
                class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-base font-semibold
                       text-brand-primary-dark bg-brand-primary rounded-xl hover:bg-brand-primary-hover transition
                       shadow-lg shadow-brand-primary/30 min-h-[48px]">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {{ __('app.salon.book') }}
            </a>
        </div>
    </section>

    {{-- Footer --}}
    <footer class="w-full bg-brand-ink text-brand-ink-muted border-t border-white/10">
        <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-10">
            <div class="salon-footer-grid w-full">
                {{-- Brand --}}
                <div class="min-w-0">
                    <a href="{{ tenant_url('/') }}" class="flex items-center gap-3 text-white hover:text-brand-primary transition">
                        @if($setting && $setting->logo && !in_array($setting->logo, ['your-logo.png', 'placeholder.webp']))
                            <img src="{{ asset('storage/logo/128/' . $setting->logo) }}" alt="" class="h-10 w-10 object-contain rounded-lg bg-white/5 p-1 shrink-0" onerror="this.style.display='none'">
                        @endif
                        <span class="font-serif text-2xl font-semibold tracking-tight">{{ $setting->company_name ?? __('app.meta.salon_default') }}</span>
                    </a>
                    @if($setting && $setting->about_us)
                        <p class="mt-4 text-sm leading-relaxed text-gray-400">
                            {{ Str::limit(strip_tags($setting->about_us), 160) }}
                        </p>
                    @endif

                    <div class="mt-6 flex flex-wrap items-center gap-3">
                        @if($setting && $setting->instagram_href)
                            <a href="{{ $setting->instagram_href }}" target="_blank" rel="noopener"
                               class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-brand-primary hover:border-brand-primary/40 transition"
                               aria-label="{{ __('app.social.instagram') }}">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        @endif
                        @if($setting && $setting->whatsapp)
                            <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $setting->whatsapp) }}" target="_blank" rel="noopener"
                               class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-[#25D366] hover:border-[#25D366]/40 transition"
                               aria-label="{{ __('app.footer.whatsapp') }}">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                        @endif
                        <a href="{{ tenant_url('/nueva-agenda') }}"
                           class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl
                                  text-brand-primary-dark bg-brand-primary hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/25">
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {{ __('app.salon.book_short') }}
                        </a>
                    </div>
                </div>

                {{-- Explore --}}
                <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">{{ __('app.salon.footer_explore') }}</p>
                    <ul class="space-y-3 text-sm">
                        <li>
                            <a href="#servicios" class="text-gray-300 hover:text-brand-primary transition">{{ __('app.salon.nav_services') }}</a>
                        </li>
                        @if($showProducts && $products->isNotEmpty())
                            <li>
                                <a href="#productos" class="text-gray-300 hover:text-brand-primary transition">{{ __('app.salon.nav_products') }}</a>
                            </li>
                        @endif
                        @if($showEmployees && $employees->isNotEmpty())
                            <li>
                                <a href="#equipo" class="text-gray-300 hover:text-brand-primary transition">{{ __('app.salon.nav_team') }}</a>
                            </li>
                        @endif
                        <li>
                            <a href="{{ tenant_url('/nueva-agenda') }}" class="text-gray-300 hover:text-brand-primary transition">{{ __('app.salon.book') }}</a>
                        </li>
                        @guest
                            <li>
                                <a href="{{ tenant_url('/login') }}" wire:navigate class="text-gray-300 hover:text-brand-primary transition">{{ __('app.nav.login') }}</a>
                            </li>
                        @endguest
                    </ul>
                </div>

                {{-- Contact --}}
                <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">{{ __('app.salon.footer_contact') }}</p>
                    <ul class="space-y-3.5 text-sm">
                        @if($setting && filled($setting->address))
                            <li class="flex gap-3 text-gray-300">
                                <svg class="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span>{{ $setting->address }}@if(filled($setting->location)) · {{ $setting->location }}@endif</span>
                            </li>
                        @elseif($setting && filled($setting->location))
                            <li class="flex gap-3 text-gray-300">
                                <svg class="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span>{{ $setting->location }}</span>
                            </li>
                        @endif
                        @if($setting && filled($setting->phone))
                            <li>
                                <a href="tel:{{ preg_replace('/\s+/', '', $setting->phone) }}" class="flex gap-3 text-gray-300 hover:text-brand-primary transition">
                                    <svg class="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    <span>{{ $setting->phone }}</span>
                                </a>
                            </li>
                        @endif
                        @if($setting && filled($setting->mail_contact))
                            <li>
                                <a href="mailto:{{ $setting->mail_contact }}" class="flex gap-3 text-gray-300 hover:text-brand-primary transition">
                                    <svg class="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    <span>{{ $setting->mail_contact }}</span>
                                </a>
                            </li>
                        @endif
                        @if($setting && filled($setting->schedules))
                            <li class="flex gap-3 text-gray-300">
                                <svg class="w-4 h-4 mt-0.5 shrink-0 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <div>
                                    <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">{{ __('app.salon.footer_hours') }}</p>
                                    <p class="whitespace-pre-line leading-relaxed">{{ $setting->schedules }}</p>
                                </div>
                            </li>
                        @elseif(! filled($setting->address ?? null) && ! filled($setting->location ?? null) && ! filled($setting->phone ?? null) && ! filled($setting->mail_contact ?? null))
                            <li>
                                <a href="{{ tenant_url('/nueva-agenda') }}" class="text-gray-300 hover:text-brand-primary transition">{{ __('app.salon.book') }}</a>
                            </li>
                        @endif
                    </ul>
                </div>
            </div>

            <div class="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                <p>{{ __('app.salon.footer_rights', ['year' => date('Y'), 'name' => $setting->company_name ?? __('app.meta.salon_default')]) }}</p>
                <p class="flex items-center gap-1.5">
                    {{ __('app.salon.made_with') }}
                    <a href="{{ url('/') }}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary-hover transition font-medium">
                        <x-shearly-logo class="w-4 h-4" />
                        Shearly
                    </a>
                </p>
            </div>
        </div>
    </footer>

    <style>
        .salon-footer-grid {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            width: 100%;
        }
        @media (min-width: 768px) {
            .salon-footer-grid {
                flex-direction: row;
                align-items: flex-start;
                justify-content: space-between;
                gap: 3rem;
            }
            .salon-footer-grid > * {
                flex: 1 1 0;
                min-width: 0;
            }
        }
    </style>
</div>
