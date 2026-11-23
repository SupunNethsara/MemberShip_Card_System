<?php

use App\Services\MembershipService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('memberships:expire', function (MembershipService $service) {
    $count = $service->expireOverdue();
    $this->info("Expired {$count} membership(s).");
})->purpose('Mark memberships past their expiry date as expired');

Artisan::command('memberships:remind {--days=7}', function (MembershipService $service) {
    $count = $service->sendExpiryReminders((int) $this->option('days'));
    $this->info("Sent {$count} expiry reminder(s).");
})->purpose('Send expiry reminder SMS to members whose plan ends within N days');

Artisan::command('members:reissue-codes {--dry-run : List the changes without saving them}', function () {
    $users = \App\Models\User::query()->where('is_staff', false)->whereNotNull('member_code')->orderBy('id')->get()
        ->reject(fn ($u) => MembershipService::isCurrentMemberCode($u->member_code));

    if ($users->isEmpty()) {
        $this->info('Every member ID already uses the current format.');

        return;
    }

    foreach ($users as $user) {
        $new = MembershipService::newMemberCode();
        $this->line("  {$user->member_code}  →  {$new}   ({$user->name})");
        if (! $this->option('dry-run')) {
            $user->forceFill(['member_code' => $new])->save();
        }
    }

    $this->info($this->option('dry-run')
        ? "{$users->count()} member ID(s) would change. Run again without --dry-run to save."
        : "Reissued {$users->count()} member ID(s). QR codes are unchanged; only the printed ID differs.");
})->purpose('Move old member IDs (e.g. MEM-2026-00042) to the card format (JHMS 1251 3428)');

Schedule::command('memberships:expire')->hourly();
Schedule::command('memberships:remind --days='.config('portal.expiry_reminder_days', 7))->dailyAt('09:00');

Artisan::command('partners:fetch-logos {--force : Replace logos that already exist} {--bundled : Use the sample logos in database/seeders/assets/partners} {--url= : Custom https image URL (requires --partner)} {--partner= : Partner slug}', function (\App\Services\PartnerLogoFetcher $fetcher) {
    $query = \App\Models\Partner::query()->with('category');
    if ($slug = $this->option('partner')) {
        $query->where('slug', $slug);
    } elseif (! $this->option('force')) {
        $query->whereNull('logo_path');
    }

    if ($this->option('bundled')) {
        foreach ($query->get() as $partner) {
            $path = $fetcher->useBundled($partner);
            $this->line($path
                ? "  <info>✓</info> {$partner->translate('name', 'en')} → storage/{$path}"
                : "  <comment>–</comment> {$partner->translate('name', 'en')}: no bundled logo");
        }

        return;
    }

    $partners = $query->get();
    if ($partners->isEmpty()) {
        $this->info('No partners need a logo.');

        return;
    }

    foreach ($partners as $partner) {
        try {
            $path = $fetcher->fetch($partner, $this->option('url') ?: null);
            $this->line("  <info>✓</info> {$partner->translate('name', 'en')} → storage/{$path}");
        } catch (\Throwable $e) {
            $this->line("  <error>✗</error> {$partner->translate('name', 'en')}: {$e->getMessage()}");
        }
    }
})->purpose('Download partner logos from public image URLs into public storage');
