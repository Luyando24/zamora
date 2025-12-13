import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 */

// Date validation
export const dateSchema = z.string().refine((date) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}, {
  message: 'Invalid date format'
});

// Guest details validation
export const guestDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').max(20),
});

// Booking creation validation
export const bookingCreateSchema = z.object({
  roomTypeId: z.string().uuid('Invalid room type ID'),
  propertyId: z.string().uuid('Invalid property ID'),
  checkIn: dateSchema,
  checkOut: dateSchema,
  guestDetails: guestDetailsSchema,
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut'],
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return checkIn >= now;
}, {
  message: 'Check-in date cannot be in the past',
  path: ['checkIn'],
});

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum'),
  currency: z.enum(['ZMW', 'USD']).default('ZMW'),
  phoneNumber: z.string().regex(/^\+?260[0-9]{9}$/, 'Invalid Zambian phone number format'),
  provider: z.enum(['mtn', 'airtel', 'zamtel'], {
    message: 'Invalid provider. Must be mtn, airtel, or zamtel'
  }),
  folioId: z.string().uuid('Invalid folio ID'),
});

// Upload validation
export const uploadSchema = z.object({
  bucket: z.enum(['player-documents', 'hotel-images', 'invoices', 'menu-images', 'room-images', 'property-images'], {
    message: 'Invalid bucket name'
  }),
  path: z.string()
    .min(1, 'Path is required')
    .max(500, 'Path too long')
    .regex(/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/, 'Invalid path format'),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
  fileType: z.string().regex(/^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/, 'Invalid file type. Only JPEG, PNG, WEBP, and PDF allowed'),
});

// ZRA invoice submission validation
export const zraInvoiceSchema = z.object({
  folioId: z.string().uuid('Invalid folio ID'),
});

// Webhook payload validation (MTN MoMo example)
export const momoWebhookSchema = z.object({
  externalId: z.string().min(1, 'External ID is required'),
  status: z.enum(['SUCCESSFUL', 'FAILED', 'PENDING']),
  amount: z.number().optional(),
  currency: z.string().optional(),
  financialTransactionId: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * Type exports for TypeScript
 */
export type GuestDetails = z.infer<typeof guestDetailsSchema>;
export type BookingCreate = z.infer<typeof bookingCreateSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Upload = z.infer<typeof uploadSchema>;
export type ZRAInvoice = z.infer<typeof zraInvoiceSchema>;
export type MomoWebhook = z.infer<typeof momoWebhookSchema>;

/**
 * Validation helper function
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T 
} | { 
  success: false; 
  errors: z.ZodError 
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
