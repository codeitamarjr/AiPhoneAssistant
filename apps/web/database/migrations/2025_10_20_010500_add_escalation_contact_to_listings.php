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
        Schema::table('listings', function (Blueprint $table) {
            $table->string('escalation_contact_name')
                ->nullable()
                ->after('summary');
            $table->string('escalation_contact_phone', 32)
                ->nullable()
                ->after('escalation_contact_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn([
                'escalation_contact_name',
                'escalation_contact_phone',
            ]);
        });
    }
};
