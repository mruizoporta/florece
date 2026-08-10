<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tablas de negocio que pertenecen a un tenant (salón). */
    private array $tenantTables = [
        'users',
        'settings',
        'customers',
        'employees',
        'categories',
        'services',
        'products',
        'appointments',
        'orders',
        'items',
        'sections',
        'sponsors',
        'instagram_feeds',
        'images',
        'schedules',
        'types',
        'status',
        'personal_information',
        'appointment_services',
        'item_order',
        'employee_social',
        'socials',
        'units',
        'providers',
        'positions',
    ];

    public function up(): void
    {
        $tenantId = DB::table('tenants')->insertGetId([
            'name' => 'Default',
            'slug' => 'default',
            'billing_region' => null,
            'locale' => 'es',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($this->tenantTables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }
            Schema::table($tableName, function (Blueprint $blueprint) use ($tenantId) {
                $blueprint->unsignedBigInteger('tenant_id')->default($tenantId);
                $blueprint->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'email']);
            $table->unique('email');
        });

        foreach (array_reverse($this->tenantTables) as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }
            Schema::table($tableName, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['tenant_id']);
                $blueprint->dropColumn('tenant_id');
            });
        }

        DB::table('tenants')->where('slug', 'default')->delete();
    }
};
