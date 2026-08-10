<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Agregar campo positions_id como clave foránea
            $table->unsignedBigInteger('positions_id')->nullable()->after('status');
            $table->foreign('positions_id')->references('id')->on('positions')->onDelete('set null');

            // Agregar los campos commission_rate y base_salary
            $table->decimal('commission_rate', 5, 2)->nullable()->after('positions_id'); // Reemplaza 'otro_campo' con el campo adecuado
            $table->decimal('base_salary', 10, 2)->nullable()->after('commission_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Eliminar los campos y la relación
            $table->dropForeign(['positions_id']);
            $table->dropColumn('positions_id');
            $table->dropColumn('commission_rate');
            $table->dropColumn('base_salary');
        });
    }
};
