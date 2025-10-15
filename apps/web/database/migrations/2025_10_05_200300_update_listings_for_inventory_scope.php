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
            $table->string('inventory_scope')->nullable()->after('group_id');

            $table->foreignId('unit_id')
                ->nullable()
                ->after('inventory_scope')
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('unit_type_id')
                ->nullable()
                ->after('unit_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['unit_type_id']);
            $table->dropColumn(['inventory_scope', 'unit_id', 'unit_type_id']);
        });
    }
};
