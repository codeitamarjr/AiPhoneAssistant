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
        Schema::create('callers', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('phone_e164')->index();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->json('meta')->nullable();
            $table->unique(['group_id','phone_e164']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('callers');
    }
};
