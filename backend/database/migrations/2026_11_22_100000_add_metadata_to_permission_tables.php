<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('group', 64)->default('General')->after('guard_name')->index();
            $table->string('label')->nullable()->after('group');
            $table->unsignedSmallInteger('sort_order')->default(0)->after('label');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->string('description')->nullable()->after('guard_name');
            $table->boolean('is_system')->default(false)->after('description');
            $table->boolean('is_staff')->default(true)->after('is_system');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', fn (Blueprint $t) => $t->dropColumn(['group', 'label', 'sort_order']));
        Schema::table('roles', fn (Blueprint $t) => $t->dropColumn(['description', 'is_system', 'is_staff']));
    }
};
