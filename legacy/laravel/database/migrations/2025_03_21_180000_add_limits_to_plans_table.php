<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('max_employees')->nullable()->after('interval')->comment('null = ilimitado');
            $table->unsignedInteger('max_services')->nullable()->after('max_employees')->comment('null = ilimitado');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_employees', 'max_services']);
        });
    }
};
