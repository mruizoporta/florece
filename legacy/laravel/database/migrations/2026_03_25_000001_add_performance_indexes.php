<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // appointments — consultas frecuentes por tenant + fecha, estado y tipo
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['tenant_id', 'start_time'], 'idx_appointments_tenant_start');
            $table->index(['tenant_id', 'status_id'],  'idx_appointments_tenant_status');
            $table->index(['tenant_id', 'type_id'],    'idx_appointments_tenant_type');
        });

        // orders — consultas frecuentes por tenant + estado de pago
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'payment_status'], 'idx_orders_tenant_payment');
        });

        // schedules — consultas frecuentes por tenant + empleado
        Schema::table('schedules', function (Blueprint $table) {
            $table->index(['tenant_id', 'employee_id'], 'idx_schedules_tenant_employee');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_tenant_start');
            $table->dropIndex('idx_appointments_tenant_status');
            $table->dropIndex('idx_appointments_tenant_type');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_tenant_payment');
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropIndex('idx_schedules_tenant_employee');
        });
    }
};
