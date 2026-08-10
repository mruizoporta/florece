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
        Schema::create('sections', function (Blueprint $table) {
            $table->id();

            $table->boolean('about_us_show_section')->default(true);
            $table->string('about_us_text', 25)->default('Sobre nosotros');
            $table->string('about_us_icon', 75)->default('icon-line-scissors fs-1');

            $table->boolean('employees_show_section')->default(true);
            $table->string('employees_text', 25)->default('Nuestro equipo');
            $table->string('employees_icon', 75)->default('icon-users fs-1');

            $table->boolean('services_show_section')->default(true);
            $table->string('services_text', 25)->default('Nuestros servicios');
            $table->string('services_icon', 75)->default('icon-sticky-note1 fs-1');

            $table->boolean('products_show_section')->default(true);
            $table->string('products_text', 25)->default('Productos');
            $table->string('products_icon', 75)->default('icon-tags fs-1');

            $table->boolean('instagram_show_section')->default(true);
            $table->string('instagram_text', 25)->default('SEGUINOS EN INSTAGRAM');
            $table->string('instagram_icon', 75)->default('icon-instagram');

            $table->boolean('whatsapp_show_section')->default(true);
            $table->string('whatsapp_title_1', 75)->default('¿TIENES ALGUNA DUDA?');
            $table->string('whatsapp_title_2', 75)->default('No dudes en consultar!');
            $table->string('whatsapp_title_3', 75)->default('Al recibir tu mensaje responderemos a la brevedad.');
            $table->string('whatsapp_icon', 75)->default('icon-whatsapp');
            $table->string('btn_whatsapp_button_text', 25)->default('Abrir chat');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
