<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Repositories\AuditLogRepository;
use App\Services\DashboardService;
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
}
