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
        Schema::create('phone_numbers', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            // Ownership context
            $table->foreignId('group_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            // Twilio fields
            $table->string('sid')->nullable(); // Twilio SID (PNxxxxxxxx)
            $table->string('phone_number')->unique();
            $table->string('friendly_name')->nullable();
            $table->string('country_code', 4)->nullable(); // e.g. IE, US
            $table->string('capabilities')->nullable(); // voice, sms, etc
            $table->boolean('is_active')->default(true);
            $table->boolean('is_connected')->default(false);

            // Assignment
            $table->foreignId('listing_id')->nullable()->constrained()->nullOnDelete();

            // Optional meta
            $table->json('meta')->nullable(); // e.g. {"voice_webhook":"..."}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phone_numbers');
    }
};
