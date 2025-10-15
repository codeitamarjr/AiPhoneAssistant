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
        Schema::create('listing_unit', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('listing_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('unit_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('display_order')->nullable();

            $table->unique(['listing_id', 'unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listing_unit');
    }
};
