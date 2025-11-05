<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('call_logs', function (Blueprint $table) {
            $table->unsignedInteger('metered_minutes')
                ->default(0)
                ->after('duration_seconds');
        });

        // Backfill historical records with a ceiling-per-minute billing rule.
        DB::statement(<<<SQL
            UPDATE call_logs
            SET metered_minutes = CASE
                WHEN duration_seconds IS NULL OR duration_seconds <= 0 THEN 0
                ELSE CEIL(duration_seconds / 60.0)
            END
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_logs', function (Blueprint $table) {
            $table->dropColumn('metered_minutes');
        });
    }
};
