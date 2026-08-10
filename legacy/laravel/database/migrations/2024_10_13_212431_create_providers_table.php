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
        Schema::create('providers', function (Blueprint $table) {
            $table->id();  // Primary key
            $table->string('name');  // Nombre del proveedor
            $table->string('email')->unique()->nullable();  // Correo electrónico, único y opcional
            $table->string('phone')->nullable();  // Teléfono del proveedor
            $table->string('contact_person')->nullable();  // Persona de contacto
            $table->string('address')->nullable();  // Dirección física
            $table->string('city')->nullable();  // Ciudad
            $table->string('country')->nullable();  // País
            $table->string('website')->nullable();  // Sitio web del proveedor
            $table->boolean('active')->default(true);  // Indica si el proveedor está activo
            $table->timestamps();  // Timestamps para fecha de creación y actualización
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
