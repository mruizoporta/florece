<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('billing_email')->constrained('plans')->nullOnDelete();
            $table->string('subscription_status', 20)->default('trial')->after('plan_id')
                ->comment('active, trial, past_due, canceled, expired');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_status');
        });

        DB::table('tenants')
            ->whereNull('trial_ends_at')
            ->whereNull('plan_id')
            ->update([
                'trial_ends_at' => now()->addDays(7),
            ]);
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'subscription_status', 'subscription_ends_at']);
        });
    }
};
