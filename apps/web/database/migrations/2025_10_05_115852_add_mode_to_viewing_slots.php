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
        Schema::table('viewing_slots', function (Blueprint $table) {
            $table->string('mode', 20)->default('open')->after('booked');
            $table->unsignedSmallInteger('slot_interval_minutes')->nullable()->after('mode');
        });

        Schema::table('viewings', function (Blueprint $table) {
            $table->dateTime('scheduled_at')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('viewings', function (Blueprint $table) {
            $table->dropColumn('scheduled_at');
        });

        Schema::table('viewing_slots', function (Blueprint $table) {
            $table->dropColumn(['mode', 'slot_interval_minutes']);
        });
    }
};
