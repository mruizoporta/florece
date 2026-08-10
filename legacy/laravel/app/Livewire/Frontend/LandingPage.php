<?php

namespace App\Livewire\Frontend;

use App\Models\Plan;
use Livewire\Component;

class LandingPage extends Component
{
    /** Región de precios mostrada en la landing (NI | US). */
    public string $pricingRegion = 'NI';

    public function mount(): void
    {
        if (session()->has('pricing_region')) {
            $saved = session('pricing_region');
            if (in_array($saved, ['NI', 'US'], true)) {
                $this->pricingRegion = $saved;

                return;
            }
        }

        $lang = request()->getPreferredLanguage() ?? 'es';
        $this->pricingRegion = str_starts_with(strtolower($lang), 'en') ? 'US' : 'NI';
    }

    public function choosePricingRegion(string $region): void
    {
        if (! in_array($region, ['NI', 'US'], true)) {
            return;
        }
        $this->pricingRegion = $region;
        session(['pricing_region' => $region]);
    }

    public function getPlansProperty()
    {
        return Plan::all()->sortBy(fn (Plan $plan) => $plan->orderRank())->values();
    }

    public function render()
    {
        $plans = $this->plans;

        return view('landing.index', [
            'plans' => $plans,
            'pricingRegion' => $this->pricingRegion,
        ])
            ->layout('layouts.landing', [
                'title' => __('app.meta.landing_title'),
                'metaDescription' => __('app.meta.landing_description'),
            ]);
    }
}
