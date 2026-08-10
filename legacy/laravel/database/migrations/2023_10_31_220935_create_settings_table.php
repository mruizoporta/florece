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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('active_appointment')->default(true);
            $table->enum('appointment_type', ['blacklist', 'whitelist'])->default('blacklist');
            $table->string('company_name')->nullable()->default(null);
            $table->string('mail_contact')->nullable()->default(null);
            $table->string('location')->nullable()->default(null);
            $table->string('address')->nullable()->default(null);
            $table->string('phone')->nullable()->default(null);
            $table->string('currency_symbol')->default('$');
            $table->string('whatsapp')->nullable()->default(null);
            $table->string('instagram_href')->nullable()->default(null);
            $table->text('embedded_content_map')->nullable()->default(null);
            $table->string('logo')->default('your-logo.png');
            $table->string('banner')->default('your-banner.jpg');
            $table->string('about_us')->nullable()->default(null);
            $table->string('schedules')->nullable()->default(null);
            $table->string('image_left')->default('image_left.jpg');
            $table->string('image_right')->default('image_right.jpg');
            $table->string('image_parallax')->default('image_parallax.jpg');
            $table->string('buttons_background_color',15)->default('ff8585');
            $table->string('buttons_text_color', 15)->default('ffffff');
            $table->string('icons_color', 15)->default('ff8585');
            $table->string('titles_color', 15)->default('ff8585');
            $table->string('footer_background_color', 15)->default('283747');
            $table->string('footer_text_color', 15)->default('ffffff');
            $table->string('btn_whatsapp_background_color', 15)->default('128c7e');
            $table->string('btn_whatsapp_text_color', 15)->default('ffffff');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
