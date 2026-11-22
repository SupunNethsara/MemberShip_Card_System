<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Physical (PVC) member card tracking.
 *  - users.photo_path      member photo printed on the card
 *  - member_cards          one row per member: current card state (pending → printed → issued)
 *  - member_card_logs      immutable history of every print / reprint / issue
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('nic');
        });

        Schema::create('member_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('card_status', ['pending', 'printed', 'issued'])->default('pending');
            $table->string('pending_reason', 32)->nullable();      // new | renewed | upgraded | reprint_requested
            $table->timestamp('card_printed_at')->nullable();
            $table->foreignId('card_printed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('reprint_count')->default(0);
            $table->timestamps();
            $table->index(['card_status', 'updated_at']);
        });

        Schema::create('member_card_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();            // the member
            $table->enum('action', ['queued', 'printed', 'reprinted', 'issued']);
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('batch_ref', 40)->nullable()->index();                       // groups a bulk print run
            $table->json('snapshot')->nullable();                                        // tier / validity as printed
            $table->string('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });

        // Backfill: every member with a currently active membership needs a card.
        $now = now();
        $members = DB::table('users')
            ->where('is_staff', false)
            ->where('status', 'active')
            ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('memberships')
                ->whereColumn('memberships.user_id', 'users.id')
                ->where('memberships.status', 'active')
                ->where('memberships.expires_at', '>', $now))
            ->pluck('id');

        foreach ($members->chunk(500) as $chunk) {
            DB::table('member_cards')->insert($chunk->map(fn ($id) => [
                'user_id' => $id, 'card_status' => 'pending', 'pending_reason' => 'new',
                'created_at' => $now, 'updated_at' => $now,
            ])->all());
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('member_card_logs');
        Schema::dropIfExists('member_cards');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('photo_path'));
    }
};
