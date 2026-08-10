<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PersonalInformation;
use App\Models\Product;
use App\Models\Schedule;
use App\Models\Section;
use App\Models\Service;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\Status;
use App\Models\Tenant;
use App\Models\Type;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DemoTenantService
{
    public const DEMO_SLUG = 'demo';

    public const DEMO_ADMIN_EMAIL = 'admin@demo.shearly.app';

    public const DEMO_ADMIN_PASSWORD = 'demo1234';

    public function seed(bool $reset = false): Tenant
    {
        return DB::transaction(function () use ($reset) {
            $tenant = Tenant::withoutGlobalScopes()->where('slug', self::DEMO_SLUG)->first();

            $needsBootstrap = false;

            if ($reset && $tenant) {
                $this->wipe($tenant);
                $needsBootstrap = true;
            }

            if (! $tenant) {
                $data = [
                    'name' => 'Salón Demo',
                    'slug' => self::DEMO_SLUG,
                    'is_demo' => true,
                    'billing_region' => 'NI',
                    'locale' => 'es',
                ];
                if (Schema::hasColumn('tenants', 'subscription_status')) {
                    $data['subscription_status'] = Tenant::STATUS_ACTIVE;
                }
                $tenant = Tenant::withoutGlobalScopes()->create($data);
                $needsBootstrap = true;
            }

            Model::unguarded(function () use ($tenant, $needsBootstrap) {
                Tenant::setCurrent($tenant);
                if ($needsBootstrap) {
                    app(TenantOnboardingService::class)->bootstrap($tenant);
                }
            });

            if ($reset || ! $tenant->users()->exists()) {
                $this->seedUsers($tenant);
            }

            if ($reset || ! Service::query()->exists()) {
                $this->seedServicesAndProducts($tenant);
            }

            if ($reset || ! Employee::query()->exists()) {
                $this->seedEmployees($tenant);
            }

            if ($reset || ! Appointment::query()->exists()) {
                $this->seedAppointments($tenant);
            }

            $this->updateSectionAndSetting($tenant);

            return $tenant->fresh();
        });
    }

    protected function wipe(Tenant $tenant): void
    {
        Tenant::setCurrent($tenant);

        $appIds = DB::table('appointments')->where('tenant_id', $tenant->id)->pluck('id');
        if ($appIds->isNotEmpty()) {
            DB::table('appointment_services')->whereIn('appointment_id', $appIds)->delete();
        }

        DB::table('appointments')->where('tenant_id', $tenant->id)->delete();

        $empIds = DB::table('employees')->where('tenant_id', $tenant->id)->pluck('id');
        if ($empIds->isNotEmpty()) {
            DB::table('schedules')->whereIn('employee_id', $empIds)->delete();
            DB::table('personal_information')->whereIn('employee_id', $empIds)->delete();
        }

        DB::table('employees')->where('tenant_id', $tenant->id)->delete();

        $itemIds = DB::table('items')->where('tenant_id', $tenant->id)->pluck('id');
        if ($itemIds->isNotEmpty()) {
            DB::table('services')->whereIn('item_id', $itemIds)->delete();
            DB::table('products')->whereIn('item_id', $itemIds)->delete();
        }

        DB::table('items')->where('tenant_id', $tenant->id)->delete();
        DB::table('customers')->where('tenant_id', $tenant->id)->delete();
        DB::table('users')->where('tenant_id', $tenant->id)->delete();
        DB::table('sections')->where('tenant_id', $tenant->id)->delete();
        DB::table('settings')->where('tenant_id', $tenant->id)->delete();
        DB::table('status')->where('tenant_id', $tenant->id)->delete();
        DB::table('types')->where('tenant_id', $tenant->id)->delete();
        DB::table('categories')->where('tenant_id', $tenant->id)->delete();
        DB::table('socials')->where('tenant_id', $tenant->id)->delete();
    }

    protected function seedUsers(Tenant $tenant): void
    {
        $admin = User::create([
            'name' => 'Admin Demo',
            'email' => self::DEMO_ADMIN_EMAIL,
            'password' => Hash::make(self::DEMO_ADMIN_PASSWORD),
            'tenant_id' => $tenant->id,
        ]);
        $admin->assignRole('Admin');

        $customerUser = User::create([
            'name' => 'Cliente Demo',
            'email' => 'cliente@demo.shearly.app',
            'password' => Hash::make('demo1234'),
            'tenant_id' => $tenant->id,
        ]);
        $customerUser->assignRole('Customer');

        Customer::create([
            'user_id' => $customerUser->id,
            'tenant_id' => $tenant->id,
        ]);
    }

    protected function seedServicesAndProducts(Tenant $tenant): void
    {
        $categories = Category::all()->keyBy('slug');

        $serviceItems = [
            ['category' => 'cortes', 'name' => 'Corte caballeros', 'slug' => 'corte-caballeros', 'price' => 250],
            ['category' => 'cortes', 'name' => 'Corte damas', 'slug' => 'corte-damas', 'price' => 300],
            ['category' => 'peinados', 'name' => 'Peinado especial', 'slug' => 'peinado-especial', 'price' => 450],
            ['category' => 'color', 'name' => 'Tinta', 'slug' => 'tinta', 'price' => 400],
        ];

        foreach ($serviceItems as $row) {
            $cat = $categories->get($row['category']) ?? $categories->first();
            $item = Item::create([
                'category_id' => $cat->id,
                'name' => $row['name'],
                'slug' => $row['slug'] . '-' . Str::random(4),
                'price' => $row['price'],
                'description' => 'Servicio de demostración.',
                'image' => 'placeholder.webp',
                'tenant_id' => $tenant->id,
            ]);
            Service::create([
                'item_id' => $item->id,
                'duration_time' => 45,
                'tenant_id' => $tenant->id,
            ]);
        }

        $productItems = [
            ['category' => 'tratamientos', 'name' => 'Shampoo profesional', 'slug' => 'shampoo-pro', 'price' => 350],
            ['category' => 'tratamientos', 'name' => 'Crema capilar', 'slug' => 'crema-capilar', 'price' => 280],
        ];

        foreach ($productItems as $row) {
            $cat = $categories->get($row['category']) ?? $categories->first();
            $item = Item::create([
                'category_id' => $cat->id,
                'name' => $row['name'],
                'slug' => $row['slug'] . '-' . Str::random(4),
                'price' => $row['price'],
                'description' => 'Producto de demostración.',
                'image' => 'placeholder.webp',
                'tenant_id' => $tenant->id,
            ]);
            Product::create([
                'item_id' => $item->id,
                'stock' => 50,
                'stock_alert' => 10,
                'long_description' => '<p>Producto demo.</p>',
                'tenant_id' => $tenant->id,
            ]);
        }
    }

    protected function seedEmployees(Tenant $tenant): void
    {
        $employees = [
            ['name' => 'María', 'description' => 'Estilista'],
            ['name' => 'Carlos', 'description' => 'Barbero'],
        ];

        foreach ($employees as $row) {
            $emp = Employee::create([
                'name' => $row['name'],
                'description' => $row['description'],
                'image' => 'placeholder.webp',
                'status' => true,
                'tenant_id' => $tenant->id,
            ]);

            PersonalInformation::create([
                'employee_id' => $emp->id,
                'document' => '00000000',
                'location' => 'Managua',
                'address' => 'Calle Demo 123',
                'phone' => '88881234',
                'tenant_id' => $tenant->id,
            ]);

            foreach ([1, 2, 3, 4, 5, 6] as $weekday) {
                Schedule::create([
                    'employee_id' => $emp->id,
                    'weekday' => $weekday,
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'status' => true,
                    'tenant_id' => $tenant->id,
                ]);
            }
        }
    }

    protected function seedAppointments(Tenant $tenant): void
    {
        $customer = Customer::first();
        $employees = Employee::all();
        $services = Service::with('item')->take(2)->get();
        $statuses = Status::all()->keyBy('name');
        $types = Type::all()->keyBy('name');

        $statusPendiente = $statuses->get('Pendiente') ?? $statuses->first();
        $statusConcluido = $statuses->get('Concluido') ?? $statuses->first();
        $typeLocal = $types->get('Local') ?? $types->first();

        foreach ([-2, -1, 0, 1] as $dayOffset) {
            $date = now()->addDays($dayOffset);
            foreach ($employees->take(2) as $emp) {
                $start = $date->copy()->setHour(10)->setMinute(0);
                $service = $services->first();
                if (! $service) {
                    continue;
                }
                $end = $start->copy()->addMinutes($service->duration_time ?? 45);

                $app = Appointment::create([
                    'customer_id' => $customer->id,
                    'employee_id' => $emp->id,
                    'status_id' => $dayOffset < 0 ? $statusConcluido->id : $statusPendiente->id,
                    'type_id' => $typeLocal->id,
                    'name' => 'Cliente Demo',
                    'start_time' => $start,
                    'end_time' => $end,
                    'tenant_id' => $tenant->id,
                ]);

                AppointmentService::create([
                    'appointment_id' => $app->id,
                    'service_id' => $service->id,
                    'tenant_id' => $tenant->id,
                ]);
            }
        }
    }

    protected function updateSectionAndSetting(Tenant $tenant): void
    {
        $premiumPlan = Plan::where('slug', 'premium')->first();
        if ($premiumPlan) {
            $tenant->update(['plan_id' => $premiumPlan->id]);
        }

        Setting::where('tenant_id', $tenant->id)->update([
            'company_name' => 'Salón Demo',
            'about_us' => 'Salón de demostración. Explora el sistema sin registrarte.',
            'logo' => null,
        ]);

        Section::where('tenant_id', $tenant->id)->update([
            'services_show_section' => true,
            'employees_show_section' => true,
            'products_show_section' => true,
        ]);
    }

    public static function demoUrl(): string
    {
        return \App\Support\TenantDataCache::demoUrl();
    }
}
