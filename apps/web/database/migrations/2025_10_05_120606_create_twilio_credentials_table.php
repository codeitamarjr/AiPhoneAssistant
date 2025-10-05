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
        Schema::create('twilio_credentials', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('account_sid');
            $table->string('auth_token_encrypted');
            $table->string('subaccount_sid')->nullable();
            $table->string('incoming_phone_sid')->nullable();
            $table->string('incoming_phone_e164')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unique(['group_id', 'account_sid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('twilio_credentials');
    }
};
