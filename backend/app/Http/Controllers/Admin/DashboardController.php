<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\Offer;
use App\Models\Partner;
use App\Models\User;
use App\Repositories\AuditLogRepository;
use App\Services\AuditLogger;
use App\Services\CatalogService;
use App\Services\DashboardService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DashboardController extends Controller
{
    public function index(DashboardService $dashboard): JsonResponse
    {
        return response()->json($dashboard->summary());
    }

    public function auditLogs(Request $request, AuditLogRepository $repo): AnonymousResourceCollection
    {
        return AuditLogResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            if ($action = $request->query('action')) {
                $q->where('action', 'like', $action.'%');
            }
        }));
    }

    public function demoDataSummary(): JsonResponse
    {
        $demoMembersCount = User::query()
            ->where('is_staff', false)
            ->where(function ($q) {
                $q->where('email', 'like', '%@example.lk')
                    ->orWhere('email', 'member@portal.lk');
            })
            ->count();

        $realMembersCount = User::query()
            ->where('is_staff', false)
            ->where('email', 'not like', '%@example.lk')
            ->where('email', '!=', 'member@portal.lk')
            ->count();

        $partnersCount = Partner::query()->count();
        $offersCount = Offer::query()->count();

        return response()->json([
            'demo_members' => $demoMembersCount,
            'real_members' => $realMembersCount,
            'total_members' => $demoMembersCount + $realMembersCount,
            'partners' => $partnersCount,
            'offers' => $offersCount,
        ]);
    }

    public function cleanDemoData(Request $request, UserService $users, CatalogService $catalog, AuditLogger $audit): JsonResponse
    {
        $mode = $request->input('mode', 'trim'); // 'trim' or 'purge'

        $deletedMembers = 0;
        $deletedPartners = 0;
        $deletedOffers = 0;

        // 1. Members
        $demoMembers = User::query()
            ->where('is_staff', false)
            ->where(function ($q) {
                $q->where('email', 'like', '%@example.lk')
                    ->orWhere('email', 'member@portal.lk');
            })
            ->orderBy('id')
            ->get();

        $membersToKeep = ($mode === 'trim') ? 2 : 0;
        $membersToDelete = $demoMembers->slice($membersToKeep);

        foreach ($membersToDelete as $m) {
            $users->delete($m, $request->user());
            $deletedMembers++;
        }

        // 2. Partners
        $partners = Partner::query()->orderBy('id')->get();
        $partnersToKeep = ($mode === 'trim') ? 2 : 0;
        $partnersToDelete = $partners->slice($partnersToKeep);

        foreach ($partnersToDelete as $p) {
            $deletedOffers += $p->offers()->count();
            $catalog->deletePartner($p);
            $deletedPartners++;
        }

        // In purge mode, delete any remaining standalone offers
        if ($mode === 'purge') {
            $remainingOffers = Offer::query()->get();
            foreach ($remainingOffers as $o) {
                $o->delete();
                $deletedOffers++;
            }
        }

        $audit->log(
            'system.demo_data_cleaned',
            "Cleaned demo data ($mode): deleted {$deletedMembers} members, {$deletedPartners} partners, {$deletedOffers} offers",
            null
        );

        return response()->json([
            'message' => ($mode === 'trim')
                ? "Sample data trimmed: kept 2 samples per feature (deleted {$deletedMembers} members, {$deletedPartners} partners, {$deletedOffers} offers)"
                : "All sample data purged (deleted {$deletedMembers} members, {$deletedPartners} partners, {$deletedOffers} offers)",
            'deleted_members' => $deletedMembers,
            'deleted_partners' => $deletedPartners,
            'deleted_offers' => $deletedOffers,
        ]);
    }
}
