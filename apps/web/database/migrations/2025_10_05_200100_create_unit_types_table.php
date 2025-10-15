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
        Schema::create('unit_types', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('building_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();

            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->integer('floor_area_min_sqm')->nullable();
            $table->integer('floor_area_max_sqm')->nullable();
            $table->string('ber')->nullable();
            $table->boolean('furnished')->nullable();
            $table->boolean('pets_allowed')->nullable();
            $table->boolean('smoking_allowed')->nullable();

            $table->integer('default_rent')->nullable();
            $table->integer('default_deposit')->nullable();
            $table->integer('min_lease_months')->nullable();

            $table->unsignedInteger('quantity_total')->nullable();
            $table->unsignedInteger('quantity_available')->nullable();

            $table->json('amenities')->nullable();
            $table->json('policies')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_types');
    }
};
