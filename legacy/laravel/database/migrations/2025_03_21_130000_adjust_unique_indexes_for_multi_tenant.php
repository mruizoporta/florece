<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Índices únicos globales que impiden el mismo slug/nombre en varios salones.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
            $table->unique(['tenant_id', 'name']);
            $table->unique(['tenant_id', 'slug']);
        });

        Schema::table('socials', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->unique(['tenant_id', 'name']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
            $table->unique(['tenant_id', 'name']);
            $table->unique(['tenant_id', 'slug']);
        });

        Schema::table('sponsors', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->unique(['tenant_id', 'name']);
        });

        Schema::table('units', function (Blueprint $table) {
            $table->dropUnique(['abbreviation']);
            $table->unique(['tenant_id', 'abbreviation']);
        });

        Schema::table('providers', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
        });

        Schema::table('positions', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['tenant_id', 'slug']);
        });

        Schema::table('images', function (Blueprint $table) {
            $table->dropUnique(['image']);
            $table->unique(['tenant_id', 'image']);
        });
    }

    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'image']);
            $table->unique('image');
        });

        Schema::table('positions', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'slug']);
            $table->unique('slug');
        });

        Schema::table('providers', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'email']);
            $table->unique('email');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'abbreviation']);
            $table->unique('abbreviation');
        });

        Schema::table('sponsors', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'name']);
            $table->unique('name');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'name']);
            $table->dropUnique(['tenant_id', 'slug']);
            $table->unique('name');
            $table->unique('slug');
        });

        Schema::table('socials', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'name']);
            $table->unique('name');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'name']);
            $table->dropUnique(['tenant_id', 'slug']);
            $table->unique('name');
            $table->unique('slug');
        });
    }
};
