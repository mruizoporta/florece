<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'stripe_price_id_ni',
        'stripe_price_id_us',
        'price_us_monthly',
        'price_ni_monthly',
        'currency_us',
        'currency_ni',
        'interval',
        'max_employees',
        'max_services',
    ];

    protected $casts = [
        'max_employees' => 'integer',
        'max_services' => 'integer',
        'price_us_monthly' => 'decimal:2',
        'price_ni_monthly' => 'decimal:2',
    ];

    /**
     * Importe mensual mostrado en landing (BD; si falta, config/shearly plan_display_prices).
     */
    public function monthlyAmountForLanding(?string $region): float
    {
        $region = strtoupper((string) $region);
        $raw = match ($region) {
            'US' => $this->price_us_monthly,
            'NI' => $this->price_ni_monthly,
            default => $this->price_ni_monthly,
        };
        if ($raw !== null && $raw !== '') {
            return (float) $raw;
        }

        $fallback = config('shearly.plan_display_prices.'.$this->slug);
        if (is_array($fallback)) {
            $key = $region === 'US' ? 'us' : 'ni';

            return (float) ($fallback[$key] ?? 0);
        }

        return 0.0;
    }

    public function currencyCodeForRegion(?string $region): string
    {
        return match (strtoupper((string) $region)) {
            'US' => $this->currency_us ?: 'USD',
            'NI' => $this->currency_ni ?: 'USD',
            default => $this->currency_ni ?: 'USD',
        };
    }

    /**
     * Etiqueta traducida (registro, emails). Siempre basada en monthlyAmountForLanding.
     */
    public function formattedMonthlyPriceLabel(?string $region): string
    {
        $amount = $this->monthlyAmountForLanding($region);
        if ($amount <= 0) {
            return __('app.pricing.price_on_request');
        }

        $code = $this->currencyCodeForRegion($region);
        $priceStr = $code === 'USD'
            ? '$'.number_format($amount, 0, '.', ',')
            : number_format($amount, 2, '.', ',').' '.$code;

        return __('app.pricing.monthly_price', ['price' => $priceStr]);
    }

    public function getStripePriceIdForRegion(?string $region): ?string
    {
        return match (strtoupper((string) $region)) {
            'US' => $this->stripe_price_id_us,
            'NI' => $this->stripe_price_id_ni,
            default => $this->stripe_price_id_ni ?? $this->stripe_price_id_us,
        };
    }

    public static function findByStripePriceId(string $stripePriceId): ?self
    {
        return static::where('stripe_price_id_ni', $stripePriceId)
            ->orWhere('stripe_price_id_us', $stripePriceId)
            ->first();
    }

    public function orderRank(): int
    {
        return match ($this->slug) {
            'basico' => 1,
            'pro' => 2,
            'premium' => 3,
            default => 0,
        };
    }

    public function isHigherThan(?Plan $other): bool
    {
        if (! $other) {
            return true;
        }

        return $this->orderRank() > $other->orderRank();
    }

    /**
     * Bullets de marketing para la landing (traducciones app.pricingfeat.*).
     *
     * @return list<string>
     */
    public function marketingFeatureLines(): array
    {
        $keys = match ($this->slug) {
            'basico' => [
                'app.pricingfeat.basico.1',
                'app.pricingfeat.basico.2',
                'app.pricingfeat.basico.3',
                'app.pricingfeat.basico.4',
            ],
            'pro' => [
                'app.pricingfeat.pro.1',
                'app.pricingfeat.pro.2',
                'app.pricingfeat.pro.3',
                'app.pricingfeat.pro.4',
            ],
            'premium' => [
                'app.pricingfeat.premium.1',
                'app.pricingfeat.premium.2',
                'app.pricingfeat.premium.3',
                'app.pricingfeat.premium.4',
            ],
            default => [],
        };

        return array_map(fn (string $key) => __($key), $keys);
    }

    public function exceedsLimits(Tenant $tenant): array
    {
        $exceeds = [];

        if ($this->max_employees !== null) {
            $employeeCount = DB::table('employees')->where('tenant_id', $tenant->id)->count();
            if ($employeeCount > $this->max_employees) {
                $exceeds['employees'] = [
                    'current' => $employeeCount,
                    'limit' => $this->max_employees,
                ];
            }
        }

        if ($this->max_services !== null) {
            $serviceCount = DB::table('services')->where('tenant_id', $tenant->id)->count();
            if ($serviceCount > $this->max_services) {
                $exceeds['services'] = [
                    'current' => $serviceCount,
                    'limit' => $this->max_services,
                ];
            }
        }

        return $exceeds;
    }
}
