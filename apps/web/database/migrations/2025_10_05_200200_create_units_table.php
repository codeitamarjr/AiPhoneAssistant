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
            $table->id();
            $table->timestamps();

            $table->foreignId('building_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('unit_type_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('group_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('identifier')->nullable(); // e.g. Apt 302
            $table->string('slug')->nullable()->unique();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('county')->nullable();
            $table->string('postcode')->nullable();

            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->integer('floor_area_sqm')->nullable();
            $table->integer('floor_number')->nullable();
            $table->string('ber')->nullable();

            $table->boolean('furnished')->nullable();
            $table->boolean('pets_allowed')->nullable();
            $table->boolean('smoking_allowed')->nullable();

            $table->integer('rent')->nullable();
            $table->integer('deposit')->nullable();
            $table->date('available_from')->nullable();
            $table->integer('min_lease_months')->nullable();

            $table->string('parking')->nullable();
            $table->string('heating')->nullable();

            $table->json('amenities')->nullable();
            $table->json('policies')->nullable();
            $table->json('extra_info')->nullable();

            $table->boolean('is_active')->default(true);
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
