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
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            // Basic Info
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();
            $table->string('title');
            $table->string('address');
            $table->string('eircode')->nullable();
            $table->text('summary')->nullable();

            // Pricing & Lease
            $table->integer('monthly_rent_eur');
            $table->integer('deposit_eur')->nullable();
            $table->date('available_from');
            $table->integer('min_lease_months')->default(12);

            // Property Details
            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->integer('floor_area_sqm')->nullable();
            $table->integer('floor_number')->nullable();
            $table->string('ber')->nullable(); // Energy rating (BER)

            // Features
            $table->boolean('furnished')->default(true);
            $table->boolean('pets_allowed')->default(false);
            $table->boolean('smoking_allowed')->default(false);
            $table->string('parking')->nullable();
            $table->string('heating')->nullable();

            // AI-relevant meta fields
            $table->json('amenities')->nullable(); // structured list: WiFi, balcony, dishwasher...
            $table->json('policies')->nullable();  // e.g., {"viewing":"By appointment only"}
            $table->json('extra_info')->nullable(); // free-form contextual details for the AI assistant

            // Media & Status
            $table->string('main_photo_path')->nullable();
            $table->boolean('is_current')->default(true);
            $table->boolean('is_published')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
