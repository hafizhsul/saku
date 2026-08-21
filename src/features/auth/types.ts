import { z } from "zod"

export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
  })
  .readonly()

export type User = z.infer<typeof UserSchema>

// ponytail: shared base so Register extends Login fields exactly once in Zod 4
// (ZodReadonly has no .extend, so we extend the plain object before wrapping)
const CredentialsBaseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const LoginRequestSchema = CredentialsBaseSchema.readonly()

export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const RegisterRequestSchema = CredentialsBaseSchema.extend({
  name: z.string().min(1).max(60),
}).readonly()

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export const UpdateProfileRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
  })
  .readonly()

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .readonly()

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>

export const AuthResponseSchema = z
  .object({
    token: z.string(),
    user: UserSchema,
  })
  .readonly()

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const AuthErrorSchema = z
  .object({
    error: z.string(),
  })
  .readonly()

export type AuthError = z.infer<typeof AuthErrorSchema>

export function parseAuthResponse(value: unknown): AuthResponse | null {
  const parsed = AuthResponseSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  return parsed.data
}

export const MeResponseSchema = z
  .object({
    user: UserSchema,
  })
  .readonly()

export type MeResponse = z.infer<typeof MeResponseSchema>

export function parseMeResponse(value: unknown): MeResponse | null {
  const parsed = MeResponseSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  return parsed.data
}