<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('stripe_price_id_ni')->nullable()->after('stripe_price_id')->comment('Price ID para Nicaragua');
            $table->string('stripe_price_id_us')->nullable()->after('stripe_price_id_ni')->comment('Price ID para Estados Unidos');
        });

        foreach (DB::table('plans')->get() as $plan) {
            if (! empty($plan->stripe_price_id)) {
                DB::table('plans')->where('id', $plan->id)->update([
                    'stripe_price_id_ni' => $plan->stripe_price_id,
                ]);
            }
        }

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('stripe_price_id');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('stripe_price_id')->nullable()->after('slug');
        });

        foreach (DB::table('plans')->get() as $plan) {
            $fallback = $plan->stripe_price_id_ni ?? $plan->stripe_price_id_us;
            if ($fallback) {
                DB::table('plans')->where('id', $plan->id)->update(['stripe_price_id' => $fallback]);
            }
        }

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['stripe_price_id_ni', 'stripe_price_id_us']);
        });
    }
};
