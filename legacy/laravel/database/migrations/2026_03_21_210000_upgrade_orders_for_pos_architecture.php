<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id')->nullable()->after('customer_id');
            $table->string('status', 20)->default('draft')->after('name');
            $table->decimal('discount_total', 10, 2)->default(0)->after('subtotal');
            $table->decimal('tax_total', 10, 2)->default(0)->after('discount_total');
            $table->timestamp('finalized_at')->nullable()->after('total');
            $table->timestamp('cancelled_at')->nullable()->after('finalized_at');
            $table->string('cancelled_reason', 255)->nullable()->after('cancelled_at');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'customer_id']);
            $table->index(['tenant_id', 'employee_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL');
        } elseif (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY customer_id BIGINT UNSIGNED NULL');
        } elseif (DB::getDriverName() === 'sqlite') {
            // En tests de sqlite este cambio se cubre por schema de pruebas.
        }

        Schema::table('item_order', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->after('item_id');
            $table->string('product_name_snapshot', 255)->nullable()->after('product_id');
            $table->decimal('unit_price_snapshot', 10, 2)->default(0)->after('product_name_snapshot');
            $table->decimal('line_discount', 10, 2)->default(0)->after('unit_price_snapshot');
            $table->decimal('line_tax', 10, 2)->default(0)->after('line_discount');
            $table->decimal('line_total', 10, 2)->default(0)->after('line_tax');

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'product_id']);
        });

        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->string('method', 20);
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('reference', 255)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'method']);
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_payments');

        Schema::table('item_order', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'order_id']);
            $table->dropIndex(['tenant_id', 'product_id']);
            $table->dropColumn([
                'product_id',
                'product_name_snapshot',
                'unit_price_snapshot',
                'line_discount',
                'line_tax',
                'line_total',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['tenant_id', 'created_at']);
            $table->dropIndex(['tenant_id', 'customer_id']);
            $table->dropIndex(['tenant_id', 'employee_id']);
            $table->dropColumn([
                'employee_id',
                'status',
                'discount_total',
                'tax_total',
                'finalized_at',
                'cancelled_at',
                'cancelled_reason',
            ]);
        });
    }
};

