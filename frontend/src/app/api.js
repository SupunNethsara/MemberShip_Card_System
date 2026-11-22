import { baseApi, qs, toFormData } from './baseApi';

/**
 * Every backend endpoint as an RTK Query hook. Tags drive cache invalidation:
 * a mutation invalidates the lists it affects, so tables refresh automatically.
 */
export const api = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ── Auth ──────────────────────────────────────────────
    login: b.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    register: b.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    sendRegisterOtp: b.mutation({ query: (body) => ({ url: '/auth/register/send-otp', method: 'POST', body }) }),
    resendRegisterOtp: b.mutation({ query: (body) => ({ url: '/auth/register/resend-otp', method: 'POST', body }) }),
    verifyRegisterOtp: b.mutation({ query: (body) => ({ url: '/auth/register/verify-otp', method: 'POST', body }) }),
    sendForgotPasswordOtp: b.mutation({ query: (body) => ({ url: '/auth/forgot-password/send-otp', method: 'POST', body }) }),
    resendForgotPasswordOtp: b.mutation({ query: (body) => ({ url: '/auth/forgot-password/resend-otp', method: 'POST', body }) }),
    resetPasswordWithOtp: b.mutation({ query: (body) => ({ url: '/auth/forgot-password/reset', method: 'POST', body }) }),
    me: b.query({ query: () => '/auth/me', providesTags: ['Me'], transformResponse: (r) => r.data }),
    logoutApi: b.mutation({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),
    updateProfile: b.mutation({
      query: (body) => ({ url: '/auth/profile', method: 'PUT', body }),
      invalidatesTags: ['Me'],
    }),

    // ── Public ────────────────────────────────────────────
    publicContent: b.query({ query: () => '/public/content', providesTags: ['Content', 'Faq'] }),
    publicTiers: b.query({ query: () => '/public/tiers', providesTags: ['Tier'], transformResponse: (r) => r.data }),
    publicCategories: b.query({ query: () => '/public/categories', providesTags: ['Category'], transformResponse: (r) => r.data }),
    publicPartners: b.query({ query: (p) => `/public/partners${qs(p)}`, providesTags: ['Partner', 'Offer'] }),
    publicGateways: b.query({ query: () => '/public/gateways', providesTags: ['PaymentGateway'], transformResponse: (r) => r.data }),
    verifyCard: b.query({ query: (token) => `/public/verify/${token}` }),

    // ── Member portal ─────────────────────────────────────
    memberDashboard: b.query({ query: () => '/member/dashboard', providesTags: ['MemberArea'] }),
    memberBenefits: b.query({ query: (p) => `/member/benefits${qs(p)}`, providesTags: ['MemberArea', 'Offer'] }),
    memberInvoices: b.query({ query: (p) => `/member/invoices${qs(p)}`, providesTags: ['MemberArea', 'Invoice'] }),
    memberInvoice: b.query({ query: (id) => `/member/invoices/${id}`, providesTags: ['Invoice'], transformResponse: (r) => r.data }),
    checkout: b.mutation({
      query: (body) => ({ url: '/member/checkout', method: 'POST', body }),
      invalidatesTags: ['MemberArea', 'Invoice'],
    }),
    uploadSlip: b.mutation({
      query: ({ id, file }) => ({ url: `/member/invoices/${id}/slip`, method: 'POST', body: toFormData({ slip: file }) }),
      invalidatesTags: ['MemberArea', 'Invoice'],
    }),

    // ── Admin: dashboard & audit ──────────────────────────
    adminDashboard: b.query({ query: () => '/admin/dashboard', providesTags: ['Dashboard'] }),
    auditLogs: b.query({ query: (p) => `/admin/audit-logs${qs(p)}`, providesTags: ['Audit'] }),

    // ── Admin: members ────────────────────────────────────
    members: b.query({ query: (p) => `/admin/members${qs(p)}`, providesTags: ['Member'] }),
    member: b.query({ query: (id) => `/admin/members/${id}`, providesTags: (r, e, id) => [{ type: 'Member', id }] }),
    createMember: b.mutation({ query: (body) => ({ url: '/admin/members', method: 'POST', body }), invalidatesTags: ['Member', 'Dashboard'] }),
    updateMember: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/members/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => ['Member', { type: 'Member', id }],
    }),
    deleteMember: b.mutation({ query: (id) => ({ url: `/admin/members/${id}`, method: 'DELETE' }), invalidatesTags: ['Member', 'Dashboard'] }),
    overrideMembership: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/members/${id}/membership`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['Member', { type: 'Member', id }, 'Dashboard', 'Audit'],
    }),

    // ── Admin: member cards (print queue) ──────────────────
    memberCards: b.query({ query: (p) => `/admin/cards${qs(p)}`, providesTags: ['Member'] }),
    memberCardLogs: b.query({ query: (id) => `/admin/cards/${id}/logs`, providesTags: ['Member'] }),
    cardSheet: b.mutation({ query: (userIds) => ({ url: '/admin/cards/sheet', method: 'POST', body: { user_ids: userIds } }) }),
    markCardsPrinted: b.mutation({
      query: (userIds) => ({ url: '/admin/cards/mark-printed', method: 'POST', body: { user_ids: userIds } }),
      invalidatesTags: ['Member', 'Audit'],
    }),
    markCardsIssued: b.mutation({
      query: ({ userIds, note }) => ({ url: '/admin/cards/mark-issued', method: 'POST', body: { user_ids: userIds, note } }),
      invalidatesTags: ['Member', 'Audit'],
    }),

    // ── Admin: tiers & categories ─────────────────────────
    tiers: b.query({ query: (p) => `/admin/tiers${qs(p)}`, providesTags: ['Tier'] }),
    saveTier: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/tiers/${id}` : '/admin/tiers', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Tier', 'Audit'],
    }),
    deleteTier: b.mutation({ query: (id) => ({ url: `/admin/tiers/${id}`, method: 'DELETE' }), invalidatesTags: ['Tier', 'Audit'] }),
    categories: b.query({ query: (p) => `/admin/categories${qs(p)}`, providesTags: ['Category'] }),
    saveCategory: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/categories/${id}` : '/admin/categories', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: b.mutation({ query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }), invalidatesTags: ['Category', 'Partner'] }),

    // ── Admin: partners & offers ──────────────────────────
    partners: b.query({ query: (p) => `/admin/partners${qs(p)}`, providesTags: ['Partner'] }),
    partnerOptions: b.query({ query: () => '/admin/partners/options', providesTags: ['Partner'], transformResponse: (r) => r.data }),
    partner: b.query({ query: (id) => `/admin/partners/${id}`, providesTags: ['Partner'], transformResponse: (r) => r.data }),
    savePartner: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/partners/${id}` : '/admin/partners', method: 'POST', body: toFormData(body) }),
      invalidatesTags: ['Partner', 'Category', 'Audit'],
    }),
    deletePartner: b.mutation({ query: (id) => ({ url: `/admin/partners/${id}`, method: 'DELETE' }), invalidatesTags: ['Partner', 'Offer', 'Audit'] }),
    offers: b.query({ query: (p) => `/admin/offers${qs(p)}`, providesTags: ['Offer'] }),
    saveOffer: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/offers/${id}` : '/admin/offers', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Offer', 'Partner', 'Tier', 'Audit'],
    }),
    deleteOffer: b.mutation({ query: (id) => ({ url: `/admin/offers/${id}`, method: 'DELETE' }), invalidatesTags: ['Offer', 'Partner', 'Audit'] }),

    // ── Admin: payments ───────────────────────────────────
    invoices: b.query({ query: (p) => `/admin/invoices${qs(p)}`, providesTags: ['Invoice'] }),
    invoice: b.query({ query: (id) => `/admin/invoices/${id}`, providesTags: ['Invoice'], transformResponse: (r) => r.data }),
    pendingApprovals: b.query({ query: () => '/admin/invoices/pending-count', providesTags: ['Invoice'] }),
    approveInvoice: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/invoices/${id}/approve`, method: 'POST', body }),
      invalidatesTags: ['Invoice', 'Member', 'Dashboard', 'Transaction', 'Audit', 'SmsLog'],
    }),
    rejectInvoice: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/invoices/${id}/reject`, method: 'POST', body }),
      invalidatesTags: ['Invoice', 'Transaction', 'Audit'],
    }),
    transactions: b.query({ query: (p) => `/admin/transactions${qs(p)}`, providesTags: ['Transaction'] }),

    // ── Admin: gateways ───────────────────────────────────
    paymentGateways: b.query({ query: () => '/admin/payment-gateways', providesTags: ['PaymentGateway'] }),
    savePaymentGateway: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/payment-gateways/${id}` : '/admin/payment-gateways', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['PaymentGateway', 'Audit'],
    }),
    deletePaymentGateway: b.mutation({ query: (id) => ({ url: `/admin/payment-gateways/${id}`, method: 'DELETE' }), invalidatesTags: ['PaymentGateway', 'Audit'] }),
    smsGateways: b.query({ query: () => '/admin/sms-gateways', providesTags: ['SmsGateway'] }),
    saveSmsGateway: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/sms-gateways/${id}` : '/admin/sms-gateways', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['SmsGateway', 'Audit'],
    }),
    deleteSmsGateway: b.mutation({ query: (id) => ({ url: `/admin/sms-gateways/${id}`, method: 'DELETE' }), invalidatesTags: ['SmsGateway', 'Audit'] }),
    testSms: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/sms-gateways/${id}/test`, method: 'POST', body }),
      invalidatesTags: ['SmsLog', 'Dashboard'],
    }),
    setSmsService: b.mutation({
      query: (enabled) => ({ url: '/admin/sms-gateways/service', method: 'PUT', body: { enabled } }),
      invalidatesTags: ['SmsGateway', 'Settings', 'Audit'],
    }),
    smsTemplates: b.query({ query: () => '/admin/sms-templates', providesTags: ['SmsTemplate'] }),
    saveSmsTemplate: b.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/sms-templates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['SmsTemplate', 'Audit'],
    }),
    smsLogs: b.query({ query: (p) => `/admin/sms-logs${qs(p)}`, providesTags: ['SmsLog'] }),

    // ── Admin: CMS ────────────────────────────────────────
    cms: b.query({ query: () => '/admin/cms', providesTags: ['Content', 'Settings'] }),
    saveCms: b.mutation({ query: (body) => ({ url: '/admin/cms', method: 'PUT', body }), invalidatesTags: ['Content', 'Settings', 'Audit'] }),
    uploadBrandLogo: b.mutation({
      query: (files) => ({ url: '/admin/cms/logo', method: 'POST', body: toFormData(files) }),
      invalidatesTags: ['Content', 'Settings', 'Audit'],
    }),
    heroSlides: b.query({ query: () => '/admin/hero-slides', providesTags: ['Content'], transformResponse: (r) => r.data }),
    saveHeroSlide: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/hero-slides/${id}` : '/admin/hero-slides', method: 'POST', body: toFormData(body) }),
      invalidatesTags: ['Content', 'Audit'],
    }),
    deleteHeroSlide: b.mutation({ query: (id) => ({ url: `/admin/hero-slides/${id}`, method: 'DELETE' }), invalidatesTags: ['Content', 'Audit'] }),
    faqs: b.query({ query: (p) => `/admin/faqs${qs(p)}`, providesTags: ['Faq'] }),
    saveFaq: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/faqs/${id}` : '/admin/faqs', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Faq'],
    }),
    deleteFaq: b.mutation({ query: (id) => ({ url: `/admin/faqs/${id}`, method: 'DELETE' }), invalidatesTags: ['Faq'] }),

    // ── Admin: roles & staff ──────────────────────────────
    roles: b.query({ query: () => '/admin/roles', providesTags: ['Role', 'Permission'] }),
    savePermissionMatrix: b.mutation({
      query: (matrix) => ({ url: '/admin/roles/matrix', method: 'PUT', body: { matrix } }),
      invalidatesTags: ['Role', 'Me', 'Audit'],
    }),
    saveRole: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/roles/${id}` : '/admin/roles', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Role', 'Staff', 'Audit'],
    }),
    deleteRole: b.mutation({ query: (id) => ({ url: `/admin/roles/${id}`, method: 'DELETE' }), invalidatesTags: ['Role', 'Audit'] }),
    staff: b.query({ query: (p) => `/admin/staff${qs(p)}`, providesTags: ['Staff'] }),
    saveStaff: b.mutation({
      query: ({ id, ...body }) => ({ url: id ? `/admin/staff/${id}` : '/admin/staff', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Staff', 'Role', 'Audit'],
    }),
    deleteStaff: b.mutation({ query: (id) => ({ url: `/admin/staff/${id}`, method: 'DELETE' }), invalidatesTags: ['Staff', 'Role', 'Audit'] }),

    // ── Notifications (shared) ────────────────────────────
    notifications: b.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: b.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: b.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: b.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useSendRegisterOtpMutation, useResendRegisterOtpMutation, useVerifyRegisterOtpMutation,
  useSendForgotPasswordOtpMutation, useResendForgotPasswordOtpMutation, useResetPasswordWithOtpMutation,
  useMeQuery, useLogoutApiMutation, useUpdateProfileMutation,
  usePublicContentQuery, usePublicTiersQuery, usePublicCategoriesQuery, usePublicPartnersQuery, usePublicGatewaysQuery, useVerifyCardQuery,
  useMemberDashboardQuery, useMemberBenefitsQuery, useMemberInvoicesQuery, useMemberInvoiceQuery, useCheckoutMutation, useUploadSlipMutation,
  useAdminDashboardQuery, useAuditLogsQuery,
  useMemberCardsQuery, useMemberCardLogsQuery, useCardSheetMutation, useMarkCardsPrintedMutation, useMarkCardsIssuedMutation,
  useMembersQuery, useMemberQuery, useCreateMemberMutation, useUpdateMemberMutation, useDeleteMemberMutation, useOverrideMembershipMutation,
  useTiersQuery, useSaveTierMutation, useDeleteTierMutation, useCategoriesQuery, useSaveCategoryMutation, useDeleteCategoryMutation,
  usePartnersQuery, usePartnerOptionsQuery, usePartnerQuery, useSavePartnerMutation, useDeletePartnerMutation,
  useOffersQuery, useSaveOfferMutation, useDeleteOfferMutation,
  useInvoicesQuery, useInvoiceQuery, usePendingApprovalsQuery, useApproveInvoiceMutation, useRejectInvoiceMutation, useTransactionsQuery,
  usePaymentGatewaysQuery, useSavePaymentGatewayMutation, useDeletePaymentGatewayMutation,
  useSmsGatewaysQuery, useSaveSmsGatewayMutation, useDeleteSmsGatewayMutation, useTestSmsMutation, useSetSmsServiceMutation,
  useSmsTemplatesQuery, useSaveSmsTemplateMutation, useSmsLogsQuery,
  useCmsQuery, useSaveCmsMutation, useUploadBrandLogoMutation, useHeroSlidesQuery, useSaveHeroSlideMutation, useDeleteHeroSlideMutation, useFaqsQuery, useSaveFaqMutation, useDeleteFaqMutation,
  useRolesQuery, useSavePermissionMatrixMutation, useSaveRoleMutation, useDeleteRoleMutation,
  useStaffQuery, useSaveStaffMutation, useDeleteStaffMutation,
  useNotificationsQuery, useMarkNotificationAsReadMutation, useMarkAllNotificationsAsReadMutation, useDeleteNotificationMutation,
} = api;
