<div>
    @if ($selectedPlan)
        <div class="mb-5 p-4 rounded-xl bg-shearly-50/90 border border-shearly-200/80">
            <p class="text-sm text-shearly-800">
                <span class="font-medium">{{ __('app.register_salon.plan_selected') }}</span> {{ $selectedPlan->name }}
            </p>
            <p class="text-sm text-shearly-900 mt-2 font-semibold">{{ $selectedPlan->formattedMonthlyPriceLabel($billing_region) }}</p>
            <p class="text-xs text-shearly-600 mt-1.5">{{ __('app.register_salon.trial_hint') }}</p>
        </div>
    @endif

    <h2 class="font-serif text-xl font-semibold text-gray-900 mb-1">{{ __('app.register_salon.title') }}</h2>
    <p class="text-sm text-gray-600 mb-1">{{ __('app.register_salon.subtitle') }}</p>
    <p class="text-xs text-gray-500 mb-6">{{ __('app.register_salon.stripe_next_step') }}</p>

    <form wire:submit="register" class="space-y-4">
        <div>
            <x-input-label for="salon_name" :value="__('app.register_salon.salon_name_label')" variant="auth" />
            <x-text-input wire:model.live="salon_name" id="salon_name" variant="auth" class="block mt-1.5 w-full" type="text" required autofocus />
            <x-input-error :messages="$errors->get('salon_name')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="slug" :value="__('app.register_salon.slug_label')" variant="auth" />
            <x-text-input wire:model="slug" id="slug" variant="auth" class="block mt-1.5 w-full font-mono text-sm" type="text" required />
            <p class="mt-1.5 text-xs text-gray-500">{{ __('app.register_salon.slug_help') }}</p>
            <x-input-error :messages="$errors->get('slug')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="admin_name" :value="__('app.register_salon.admin_name_label')" variant="auth" />
            <x-text-input wire:model="admin_name" id="admin_name" variant="auth" class="block mt-1.5 w-full" type="text" required />
            <x-input-error :messages="$errors->get('admin_name')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="email" :value="__('app.register_salon.email_label')" variant="auth" />
            <x-text-input wire:model="email" id="email" variant="auth" class="block mt-1.5 w-full" type="email" required autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="password" :value="__('app.register_salon.password_label')" variant="auth" />
            <x-text-input wire:model="password" id="password" variant="auth" class="block mt-1.5 w-full" type="password" required autocomplete="new-password" />
            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="password_confirmation" :value="__('app.register_salon.password_confirm_label')" variant="auth" />
            <x-text-input wire:model="password_confirmation" id="password_confirmation" variant="auth" class="block mt-1.5 w-full" type="password" required autocomplete="new-password" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
                <x-input-label for="billing_region" :value="__('app.register_salon.billing_region_label')" variant="auth" />
                <select wire:model="billing_region" id="billing_region" class="block mt-1.5 w-full rounded-2xl border border-gray-200/95 bg-white py-3 px-3.5 text-sm text-brand-ink shadow-[0_1px_2px_rgba(29,31,36,0.04)] transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 hover:border-gray-300/90">
                    <option value="NI">{{ __('app.register_salon.region_ni') }}</option>
                    <option value="US">{{ __('app.register_salon.region_us') }}</option>
                </select>
                <x-input-error :messages="$errors->get('billing_region')" class="mt-2" />
            </div>
            <div>
                <x-input-label for="locale" :value="__('app.register_salon.locale_label')" variant="auth"/>
                <select wire:model="locale" id="locale" class="block mt-1.5 w-full rounded-2xl border border-gray-200/95 bg-white py-3 px-3.5 text-sm text-brand-ink shadow-[0_1px_2px_rgba(29,31,36,0.04)] transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 hover:border-gray-300/90">
                    <option value="es">{{ __('app.register_salon.locale_es') }}</option>
                    <option value="en">{{ __('app.register_salon.locale_en') }}</option>
                </select>
                <x-input-error :messages="$errors->get('locale')" class="mt-2" />
            </div>
        </div>

        <div class="flex justify-end pt-4">
            <x-auth-submit-button wire:loading.attr="disabled" class="min-w-[12rem]">
                {{ __('app.register_salon.submit') }}
            </x-auth-submit-button>
        </div>
    </form>
</div>
