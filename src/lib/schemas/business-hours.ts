import { z } from "zod";

// Skema untuk validasi waktu jam kerja
export const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: "Format waktu harus HH:MM (24 jam)",
});

// Skema untuk validasi hari kerja
export const workingDaySchema = z.object({
  day: z.enum([
    "monday",
    "tuesday", 
    "wednesday", 
    "thursday", 
    "friday", 
    "saturday", 
    "sunday"
  ]),
  isActive: z.boolean().default(true),
  openTime: timeSchema,
  closeTime: timeSchema,
});

// Skema untuk pengaturan jam kerja keseluruhan
export const businessHoursSchema = z.object({
  isEnabled: z.boolean().default(false),
  workingDays: z.array(workingDaySchema),
  offWorkMessage: z.string().min(10, {
    message: "Pesan harus memiliki minimal 10 karakter",
  }).max(500, {
    message: "Pesan tidak boleh melebihi 500 karakter",
  }).default("Maaf, kami sedang tutup. Silakan kembali pada jam operasional kami."),
});

export type BusinessHoursSettings = z.infer<typeof businessHoursSchema>;
export type WorkingDay = z.infer<typeof workingDaySchema>;
