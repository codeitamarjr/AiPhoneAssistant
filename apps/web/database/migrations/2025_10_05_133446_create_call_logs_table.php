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
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('group_id')->constrained()->cascadeOnDelete();

            $table->string('twilio_call_sid')->unique();   // CAxxxxxxxx
            $table->foreignId('listing_id')->nullable()->constrained()->nullOnDelete();
            $table->string('from_e164');                   // +353...
            $table->string('to_e164');                     // your Twilio number
            $table->string('caller_name')->nullable();     // from Lookup or collected later

            $table->enum('status', ['queued', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled'])
                ->default('queued');

            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable(); // whole-call duration

            $table->json('meta')->nullable();              // carrier info, recording URLs, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};
