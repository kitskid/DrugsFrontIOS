import {API_BASE} from '@env';

import type {
  MealScheduleDto,
  UpsertMealScheduleDto,
} from './meals/types.ts';
import {passwordConfig} from './index.ts';
import {apiClient} from './client.ts';

export const apiProfile = {
    session: {
        terminateCurrent: async () => {
            return apiClient.delete(
                `${API_BASE}/api/auth/session/terminate/current`,
                {requiresAuth: true},
            );
        },
    },
    emailChange: {
        verifyPassword: async (currentPassword: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/email-change/verify-password`,
                {currentPassword},
                {requiresAuth: true},
            );
        },
        request: async (newEmail: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/email-change/request`,
                {newEmail},
                {requiresAuth: true},
            );
        },
        requestResend: async () => {
            return apiClient.post(
                `${API_BASE}/api/auth/email-change/request/resend`,
                {},
                {requiresAuth: true},
            );
        },
        confirm: async (code: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/email-change/confirm`,
                {code},
                {requiresAuth: true},
            );
        },
    },
    accountDelete: {
        request: async () => {
            return apiClient.post(
                `${API_BASE}/api/auth/account-delete/request`,
                {},
                {requiresAuth: true},
            );
        },
        confirm: async (code: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/account-delete/confirm`,
                {code},
                {requiresAuth: true},
            );
        },
    },
    passwordChange: {
        resetAuth: async (password: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/password-reset/forgot/reset/auth`,
                {password},
                {...(await passwordConfig()), requiresAuth: true},
            );
        },
        resetAuthRepeat: async (passwordRepeat: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/password-reset/forgot/reset/auth/repeat`,
                {passwordRepeat},
                {...(await passwordConfig()), requiresAuth: true},
            );
        },
    },
    meals: {
        getMe: async () => {
            return apiClient.get<MealScheduleDto | null>(
                `${API_BASE}/api/medicines/meal-schedules/me`,
                {requiresAuth: true},
            );
        },
        upsertMe: async (payload: UpsertMealScheduleDto) => {
            return apiClient.put<MealScheduleDto>(
                `${API_BASE}/api/medicines/meal-schedules/me`,
                payload,
                {requiresAuth: true},
            );
        },
        patchReminders: async () => {
            return apiClient.patch<MealScheduleDto>(
                `${API_BASE}/api/medicines/meal-schedules/me/reminders`,
                undefined,
                {requiresAuth: true},
            );
        },
        deleteMe: async () => {
            return apiClient.delete(
                `${API_BASE}/api/medicines/meal-schedules/me`,
                {requiresAuth: true},
            );
        },
    },
};
