<?php

namespace App\Livewire\Frontend;

use App\Livewire\Traits\ImageTrait;
use App\Models\Product;
use App\Models\Section;
use App\Models\Setting;
use App\Models\Tenant;
use App\Support\TenantDataCache;
use Livewire\Component;

class SalonPublicPage extends Component
{
    use ImageTrait;

    public ?int $selectedProductId = null;

    public function selectProduct(int $id): void
    {
        $this->selectedProductId = $id;
    }

    public function clearProduct(): void
    {
        $this->selectedProductId = null;
    }

    public function render()
    {
        $tenant = Tenant::current();
        $setting = TenantDataCache::setting($tenant) ?? new Setting;
        $section = TenantDataCache::section($tenant) ?? new Section;

        $showEmployees = $section->employees_show_section && $this->planAllowsSection($tenant, 'employees');
        $showProducts = $section->products_show_section && $this->planAllowsSection($tenant, 'products');

        $catalog = $tenant
            ? TenantDataCache::publicCatalog($tenant, $showEmployees, $showProducts)
            : [
                'services' => collect(),
                'employees' => collect(),
                'products' => collect(),
            ];

        $selectedProduct = null;
        if ($this->selectedProductId) {
            $selectedProduct = $catalog['products']->firstWhere('id', $this->selectedProductId)
                ?? Product::with(['item.category', 'images'])->find($this->selectedProductId);
        }

        return view('salon.index', [
            'setting' => $setting,
            'section' => $section,
            'services' => $catalog['services'],
            'employees' => $catalog['employees'],
            'products' => $catalog['products'],
            'showEmployees' => $showEmployees,
            'showProducts' => $showProducts,
            'selectedProduct' => $selectedProduct,
            'isDemo' => $tenant?->isDemo() ?? false,
        ])
            ->layout('layouts.salon', [
                'title' => $setting->company_name ?: __('app.meta.salon_default'),
            ]);
    }

    private function planAllowsSection(?Tenant $tenant, string $section): bool
    {
        $plan = $tenant?->plan;
        $slug = $plan?->slug ?? 'basico';

        return match ($section) {
            'employees' => in_array($slug, ['pro', 'premium'], true),
            'products' => $slug === 'premium',
            default => true,
        };
    }
}
