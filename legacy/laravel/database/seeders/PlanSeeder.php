<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Básico',
                'slug' => 'basico',
                'stripe_price_id_ni' => env('STRIPE_PRICE_BASICO_NI', 'price_xxx'),
                'stripe_price_id_us' => env('STRIPE_PRICE_BASICO_US', 'price_xxx'),
                'price_us_monthly' => 19,
                'price_ni_monthly' => 9,
                'currency_us' => 'USD',
                'currency_ni' => 'USD',
                'interval' => 'month',
                'max_employees' => 3,
                'max_services' => 10,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'stripe_price_id_ni' => env('STRIPE_PRICE_PRO_NI', 'price_xxx'),
                'stripe_price_id_us' => env('STRIPE_PRICE_PRO_US', 'price_xxx'),
                'price_us_monthly' => 39,
                'price_ni_monthly' => 19,
                'currency_us' => 'USD',
                'currency_ni' => 'USD',
                'interval' => 'month',
                'max_employees' => null,
                'max_services' => null,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'stripe_price_id_ni' => env('STRIPE_PRICE_PREMIUM_NI', 'price_xxx'),
                'stripe_price_id_us' => env('STRIPE_PRICE_PREMIUM_US', 'price_xxx'),
                'price_us_monthly' => 69,
                'price_ni_monthly' => 29,
                'currency_us' => 'USD',
                'currency_ni' => 'USD',
                'interval' => 'month',
                'max_employees' => null,
                'max_services' => null,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
