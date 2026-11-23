<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\ContactInquiry;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContactInquiryController extends Controller
{
    /** Public "Send an Inquiry" form: saves the message and alerts staff who can read inquiries. */
    public function store(Request $request): JsonResponse
    {

        // Honeypot: bots fill every field. Browsers/password managers can autofill it too, so a hit is never
        // discarded — it is saved as "spam" (no staff alert) where staff can still find and restore it.
        $suspectedSpam = filled($request->input('website'));

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'required_without:phone', 'email', 'max:190'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
            'subject' => ['nullable', Rule::in(array_keys(ContactInquiry::SUBJECTS))],
            'message' => ['required', 'string', 'min:5', 'max:5000'],
        ], [
            'email.required_without' => 'Please provide an email address or a mobile number.',
            'phone.required_without' => 'Please provide an email address or a mobile number.',
        ]);

        $inquiry = ContactInquiry::query()->create($data + [
            'status' => $suspectedSpam ? 'spam' : 'new',
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
        ]);

        if ($suspectedSpam) {
            // Same reply as a real submission, so bots learn nothing.
            return response()->json(['message' => 'Inquiry received.', 'id' => $inquiry->id], 201);
        }

        $staff = User::query()->where('is_staff', true)->where('status', 'active')->permission('inquiries.view')->get();
        if ($staff->isNotEmpty()) {
            $topic = ContactInquiry::SUBJECTS[$inquiry->subject] ?? 'General';
            PortalNotification::dispatchTo(
                $staff,
                'New contact inquiry',
                "{$inquiry->name} · {$topic}: ".Str::limit($inquiry->message, 80),
                'info',
                "/admin/inquiries?open={$inquiry->id}",
                'mail'
            );
        }

        return response()->json(['message' => 'Inquiry received.', 'id' => $inquiry->id], 201);
    }
}
