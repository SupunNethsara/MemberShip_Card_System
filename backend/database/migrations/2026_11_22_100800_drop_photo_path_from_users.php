<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/** Member photos are not used on cards — remove the column and any uploaded files. */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'photo_path')) {
            Schema::table('users', fn (Blueprint $t) => $t->dropColumn('photo_path'));
        }
        Storage::disk('public')->deleteDirectory('members');
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->string('photo_path')->nullable()->after('nic'));
    }
};