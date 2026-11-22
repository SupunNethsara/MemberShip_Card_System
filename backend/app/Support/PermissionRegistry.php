<?php

namespace App\Support;

/**
 * Single source of truth for permissions, their module grouping and default role grants.
 * Seeders sync from here; the admin Permission Matrix renders these groups as rows.
 */
final class PermissionRegistry
{
    public const GROUPS = [
        'Dashboard & Audit' => [
            'dashboard.view' => 'View executive dashboard',
            'audit.view' => 'View system audit log',
        ],
        'Members' => [
            'members.view' => 'View members',
            'members.create' => 'Create members',
            'members.update' => 'Edit member profiles',
            'members.delete' => 'Delete members',
            'members.override' => 'Manual membership override',
        ],
        'Member Cards' => [
            'cards.view' => 'View card print queue & history',
            'cards.print' => 'Preview, print & reprint member cards',
            'cards.issue' => 'Mark printed cards as issued to members',
        ],
        'Membership Tiers' => [
            'tiers.view' => 'View tiers',
            'tiers.manage' => 'Create / edit / delete tiers',
        ],
        'Partner Businesses' => [
            'partners.view' => 'View partners',
            'partners.manage' => 'Create / edit / delete partners & categories',
        ],
        'Offers & Benefits' => [
            'offers.view' => 'View offers',
            'offers.manage' => 'Create / edit / delete offers & tier mapping',
        ],
        'Payments & Invoices' => [
            'payments.view' => 'View invoices & transactions',
            'payments.manage' => 'Approve slips, cancel or refund invoices',
        ],
        'Payment Gateways' => [
            'gateways.payment.view' => 'View payment gateway configuration',
            'gateways.payment.manage' => 'Configure payment gateways & credentials',
        ],
        'SMS Gateways' => [
            'gateways.sms.view' => 'View SMS gateway configuration',
            'gateways.sms.manage' => 'Configure SMS gateways, credentials & send tests',
            'sms.templates.manage' => 'Edit SMS event templates',
            'sms.logs.view' => 'View SMS delivery logs',
        ],
        'CMS & Localization' => [
            'cms.view' => 'View CMS content',
            'cms.manage' => 'Edit homepage, FAQs, terms & site settings',
        ],
        'Roles & Staff' => [
            'roles.view' => 'View roles & permission matrix',
            'roles.manage' => 'Create roles & update permission matrix',
            'staff.view' => 'View staff accounts',
            'staff.manage' => 'Create / edit / delete staff accounts',
        ],
    ];

    public const ROLES = [
        'Super Admin' => ['description' => 'Unrestricted access to every module.', 'staff' => true, 'permissions' => '*'],
        'Operations Manager' => [
            'description' => 'Runs day-to-day membership operations and content.',
            'staff' => true,
            'permissions' => [
                'dashboard.view', 'members.view', 'members.create', 'members.update', 'members.override',
                'cards.view', 'cards.print', 'cards.issue',
                'tiers.view', 'tiers.manage', 'partners.view', 'offers.view', 'payments.view',
                'sms.logs.view', 'sms.templates.manage', 'cms.view', 'cms.manage', 'staff.view',
            ],
        ],
        'Partner Manager' => [
            'description' => 'Onboards partner merchants and curates offers.',
            'staff' => true,
            'permissions' => ['dashboard.view', 'tiers.view', 'partners.view', 'partners.manage', 'offers.view', 'offers.manage'],
        ],
        'Finance & Gateways Admin' => [
            'description' => 'Owns revenue, invoices and payment/SMS gateway configuration.',
            'staff' => true,
            'permissions' => [
                'dashboard.view', 'members.view', 'payments.view', 'payments.manage',
                'gateways.payment.view', 'gateways.payment.manage', 'gateways.sms.view', 'gateways.sms.manage',
                'sms.logs.view', 'audit.view',
            ],
        ],
        'Support Staff' => [
            'description' => 'Assists members with accounts, payments and SMS issues.',
            'staff' => true,
            'permissions' => ['members.view', 'members.update', 'payments.view', 'tiers.view', 'partners.view', 'offers.view', 'sms.logs.view', 'cards.view', 'cards.print', 'cards.issue'],
        ],
        'Member' => ['description' => 'Card holder with access to the member portal.', 'staff' => false, 'permissions' => []],
    ];

    /** @return array<int, array{name:string,label:string,group:string,sort_order:int}> */
    public static function flat(): array
    {
        $out = [];
        $i = 0;
        foreach (self::GROUPS as $group => $perms) {
            foreach ($perms as $name => $label) {
                $out[] = ['name' => $name, 'label' => $label, 'group' => $group, 'sort_order' => $i++];
            }
        }

        return $out;
    }

    public static function all(): array
    {
        return array_column(self::flat(), 'name');
    }
}
