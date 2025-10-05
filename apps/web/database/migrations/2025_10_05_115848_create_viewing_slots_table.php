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
        Schema::create('viewing_slots', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->dateTime('start_at');
            $table->unsignedSmallInteger('capacity')->default(4);
            $table->unsignedSmallInteger('booked')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('viewing_slots');
    }
};
