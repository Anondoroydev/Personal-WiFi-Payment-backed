export const Role = { USER: "USER", ADMIN: "ADMIN" } as const;
export type Role = keyof typeof Role;
export const PackageType = { INTERNET: "INTERNET", TV: "TV" } as const;
export type PackageType = keyof typeof PackageType;
export const VoucherStatus = { AVAILABLE: "AVAILABLE", USED: "USED" } as const;
export type VoucherStatus = keyof typeof VoucherStatus;
export const PaymentStatus = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" } as const;
export type PaymentStatus = keyof typeof PaymentStatus;