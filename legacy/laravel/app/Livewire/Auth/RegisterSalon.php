<?php

namespace App\Livewire\Auth;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\DemoTenantService;
use App\Services\TenantOnboardingService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Livewire\Component;
use Illuminate\Support\Str;

class RegisterSalon extends Component
{
    public function mount(): void
    {
        $this->plan_slug = request()->query('plan');
        $region = request()->query('region');
        if (in_array($region, ['NI', 'US'], true)) {
            $this->billing_region = $region;
        }
    }
    public string $salon_name = '';

    public string $slug = '';

    public string $admin_name = '';

    public string $email = '';

    public string $password = '';

    public string $password_confirmation = '';

    /** Nicaragua (NI) o Estados Unidos (US) — precios / facturación futura */
    public string $billing_region = 'NI';

    public string $locale = 'es';

    /** Plan precargado desde landing (opcional) */
    public ?string $plan_slug = null;

    public function updatedSalonName(string $value): void
    {
        $this->slug = Str::slug($value);
    }

    protected function rules(): array
    {
        return [
            'salon_name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required',
                'string',
                'max:80',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('tenants', 'slug'),
                Rule::notIn([DemoTenantService::DEMO_SLUG, 'www', 'app', 'api']),
            ],
            'admin_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'billing_region' => ['required', 'in:NI,US'],
            'locale' => ['required', 'in:es,en'],
            'plan_slug' => ['nullable', 'string', Rule::exists('plans', 'slug')],
        ];
    }

    public function register(): void
    {
        $this->plan_slug = $this->plan_slug ?: null;
        $this->slug = Str::slug($this->slug ?: $this->salon_name);

        $this->validate();

        $plan = Plan::query()->where('slug', $this->plan_slug ?: 'basico')->firstOrFail();

        [$user, $tenant] = DB::transaction(function () use ($plan) {
            $tenant = Tenant::query()->create([
                'name' => $this->salon_name,
                'slug' => $this->slug,
                'is_demo' => false,
                'billing_region' => $this->billing_region,
                'locale' => $this->locale,
                'plan_id' => $plan->id,
                'billing_email' => $this->email,
                'subscription_status' => Tenant::STATUS_PENDING_PAYMENT,
                'trial_ends_at' => null,
            ]);

            app(TenantOnboardingService::class)->bootstrap($tenant);

            $user = User::query()->create([
                'name' => $this->admin_name,
                'email' => $this->email,
                'password' => Hash::make($this->password),
                'tenant_id' => $tenant->id,
            ]);

            $user->assignRole('Admin');

            return [$user, $tenant];
        });

        event(new Registered($user));

        Auth::login($user);

        $this->redirect(billing_checkout_url($plan->slug, $tenant), navigate: false);
    }

    public function render()
    {
        $selectedPlan = $this->plan_slug
            ? Plan::where('slug', $this->plan_slug)->first()
            : null;

        return view('livewire.auth.register-salon', [
            'selectedPlan' => $selectedPlan,
        ])->layout('layouts.guest', [
            'title' => __('app.register_salon.title').' — '.config('app.name', 'Shearly'),
        ]);
    }
}
