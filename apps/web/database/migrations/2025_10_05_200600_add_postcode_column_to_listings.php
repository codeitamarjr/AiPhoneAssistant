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
        if (!Schema::hasColumn('listings', 'postcode')) {
            Schema::table('listings', function (Blueprint $table) {
                $table->string('postcode')->nullable()->after('address');
            });
        }

        if (Schema::hasColumn('listings', 'postcode')) {
            DB::table('listings')
                ->whereNull('postcode')
                ->update(['postcode' => DB::raw('postcode')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('listings', 'postcode')) {
            DB::table('listings')
                ->whereNull('postcode')
                ->update(['postcode' => DB::raw('postcode')]);
        }

        $usingSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        if (Schema::hasColumn('listings', 'postcode') && !$usingSqlite) {
            Schema::table('listings', function (Blueprint $table) {
                $table->dropColumn('postcode');
            });
        }
    }
};
