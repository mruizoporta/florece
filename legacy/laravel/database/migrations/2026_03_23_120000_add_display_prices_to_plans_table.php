<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_us_monthly', 10, 2)->nullable()->after('stripe_price_id_us');
            $table->decimal('price_ni_monthly', 10, 2)->nullable()->after('price_us_monthly');
            $table->string('currency_us', 3)->default('USD')->after('price_ni_monthly');
            $table->string('currency_ni', 3)->default('USD')->after('currency_us');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'price_us_monthly',
                'price_ni_monthly',
                'currency_us',
                'currency_ni',
            ]);
        });
    }
};
