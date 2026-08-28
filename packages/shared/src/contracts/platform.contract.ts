import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();
const anyResponse = z.any();

export const platformContract = c.router({
  // Auth
  getSetupStatus: {
    method: 'GET',
    path: '/api/platform/auth/setup/status',
    responses: { 200: anyResponse, 401: anyResponse, 403: anyResponse },
    summary: 'Get platform setup status',
  },
  setupRegister: {
    method: 'POST',
    path: '/api/platform/auth/setup/register',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Register first super-user',
  },
  passwordForgot: {
    method: 'POST',
    path: '/api/platform/auth/password/forgot',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse },
    summary: 'Request platform password reset',
  },
  passwordReset: {
    method: 'POST',
    path: '/api/platform/auth/password/reset',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse },
    summary: 'Complete platform password reset',
  },
  passwordResend: {
    method: 'POST',
    path: '/api/platform/auth/password/resend',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse },
    summary: 'Resend platform password reset code',
  },
  // Profile
  getMe: {
    method: 'GET',
    path: '/api/platform/auth/me',
    responses: { 200: anyResponse, 401: anyResponse },
    summary: 'Get platform user profile',
  },
  patchMe: {
    method: 'PATCH',
    path: '/api/platform/auth/me',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 401: anyResponse },
    summary: 'Update platform user profile',
  },
  changePassword: {
    method: 'POST',
    path: '/api/platform/auth/change-password',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 401: anyResponse },
    summary: 'Change platform user password',
  },
  // Settings
  getSettings: {
    method: 'GET',
    path: '/api/platform/settings',
    responses: { 200: anyResponse, 401: anyResponse, 403: anyResponse },
    summary: 'Get global platform settings',
  },
  updateSettings: {
    method: 'PUT',
    path: '/api/platform/settings',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Update global platform settings',
  },
  resetDatabase: {
    method: 'POST',
    path: '/api/platform/settings/reset-database',
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Reset and re-seed the platform database',
  },
  // System admin
  migrateAndRestart: {
    method: 'POST',
    path: '/api/platform/admin/system/migrate-and-restart',
    body: z.any(),
    responses: { 202: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Apply Drizzle migrations and reload backend',
  },
  getActivityLogs: {
    method: 'GET',
    path: '/api/platform/admin/system/activity-logs',
    responses: { 200: anyResponse, 401: anyResponse, 403: anyResponse },
    summary: 'Get super-user activity logs',
  },
  // Workspaces
  listWorkspaces: {
    method: 'GET',
    path: '/api/platform/workspaces',
    responses: { 200: anyResponse, 401: anyResponse, 403: anyResponse },
    summary: 'List all workspaces',
  },
  patchWorkspace: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain',
    pathParams: z.object({ subdomain: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse, 404: anyResponse },
    summary: 'Enable or disable a workspace',
  },
  deleteWorkspace: {
    method: 'DELETE',
    path: '/api/platform/workspaces/:subdomain',
    pathParams: z.object({ subdomain: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse, 404: anyResponse },
    summary: 'Delete a workspace',
  },
  getWorkspaceModules: {
    method: 'GET',
    path: '/api/platform/workspaces/:subdomain/modules',
    pathParams: z.object({ subdomain: z.string() }),
    responses: { 200: anyResponse, 403: anyResponse, 404: anyResponse },
    summary: 'Get enabled modules for workspace',
  },
  updateWorkspaceModules: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain/modules',
    pathParams: z.object({ subdomain: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Update enabled modules for workspace',
  },
  patchWorkspaceEmailVerification: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain/email-verification',
    pathParams: z.object({ subdomain: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse, 404: anyResponse },
    summary: 'Toggle email verification requirement for a workspace',
  },
  // Admins (users)
  listAdmins: {
    method: 'GET',
    path: '/api/platform/users',
    responses: { 200: anyResponse, 401: anyResponse, 403: anyResponse },
    summary: 'List platform admins',
  },
  createAdmin: {
    method: 'POST',
    path: '/api/platform/users',
    body: z.any(),
    responses: { 200: anyResponse, 201: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Create a new platform admin',
  },
  updateAdminPermissions: {
    method: 'PATCH',
    path: '/api/platform/users/:adminId/permissions',
    pathParams: z.object({ adminId: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Update admin permissions',
  },
  setAdminDisabled: {
    method: 'PATCH',
    path: '/api/platform/users/:adminId/disabled',
    pathParams: z.object({ adminId: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Enable or disable a platform admin',
  },
  deleteAdmin: {
    method: 'DELETE',
    path: '/api/platform/users/:adminId',
    pathParams: z.object({ adminId: z.string() }),
    body: z.any(),
    responses: { 200: anyResponse, 400: anyResponse, 403: anyResponse },
    summary: 'Delete a platform admin',
  },
});
