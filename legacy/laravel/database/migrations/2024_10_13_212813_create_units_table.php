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
        Schema::create('units', function (Blueprint $table) {
            $table->id();  // Primary key
            $table->string('name');  // Nombre de la unidad de medida
            $table->string('abbreviation')->unique();  // Abreviatura (ej: kg, lb, lt)
            $table->boolean('active')->default(true);  // Indica si la unidad de medida está activa
            $table->timestamps();  // Timestamps para fecha de creación y actualización
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
