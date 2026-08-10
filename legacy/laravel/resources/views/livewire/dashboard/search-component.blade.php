<div>
    <div class="relative max-w-md">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg class="w-[18px] h-[18px] text-brand-ink-muted/70" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
        </div>
        <input type="search"
               wire:model.live.debounce.800ms="search"
               placeholder="{{ $placeholder }}"
               class="w-full rounded-xl border border-brand-blush-light bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink
                      placeholder:text-brand-ink-muted/50 transition-all
                      focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15
                      hover:border-brand-blush-light/80">
    </div>
</div>
