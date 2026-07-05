import {API_BASE} from "@env";
import {apiClient} from "./client.ts";
import {passwordConfig, sessionConfig} from "./index.ts";

export type PushPlatform = 'ANDROID' | 'IOS';

export type PushTokenPayload = {
    token: string;
    platform: PushPlatform;
    deviceId: string;
    name: string;
    model: string;
    osVersion: string;
    appVersion: string;
    language: string;
    timezone: string;
};

export type RegisterFcmTokenResponse = {
    success: boolean;
    tokenId: string;
    deviceId: string;
    message: string;
};

export type SendTestPushPayload = {
    message: string;
};

export type SendTestPushResponse = {
    success: boolean;
    message: string;
    data: {
        userId: string;
        sent: boolean;
    };
};

export type UpdateTimezonePayload = {
    timezone: string;
};

export type UpdateTimezoneResponse = {
    ok: boolean;
};

export type PatientTimezoneResponse = {
    timezone: string;
};

export const apiAuth = {
    me: async () => {
        return apiClient.get(`${API_BASE}/api/auth/user/me`, {requiresAuth: true});
    },
    signUp: {
        passwordAgreement: async (password: string) => {
            return apiClient.post(`${API_BASE}/api/auth/register/3`, {password}, await sessionConfig())
        },
        passwordRepeat: async (passwordRepeat: string) => {
            return apiClient.post(`${API_BASE}/api/auth/register/4`, {passwordRepeat}, await sessionConfig())
        },
        addEmail: async (email: string, acceptedUserAgreement: boolean) => {
            return apiClient.post(`${API_BASE}/api/auth/register/1`, {email, acceptedUserAgreement}, await sessionConfig())
        },
        resendEmailCode: async () => {
            return apiClient.post(`${API_BASE}/api/auth/register/1/resend`, {}, await sessionConfig())
        },
        confirmEmailCode: async (code: string) => {
            return apiClient.post(`${API_BASE}/api/auth/register/2`, {code}, await sessionConfig())
        },
        updateName: async (name: string) => {
            return apiClient.patch(`${API_BASE}/api/auth/user/name`, {name}, {requiresAuth: true})
        },
    },

    signIn: {
        login: async (email: string, password: string) => {
            return apiClient.post(`${API_BASE}/api/auth/login/email`, {email, password});
        },
        passwordResetForgotRequest: async (email: string) => {
            return apiClient.post(`${API_BASE}/api/auth/password-reset/forgot/request`, {email});
        },
        passwordResetForgotResend: async () => {
            return apiClient.post(`${API_BASE}/api/auth/password-reset/forgot/resend`, {}, await passwordConfig());
        },
        passwordResetForgotConfirm: async (code: string) => {
            return apiClient.post(`${API_BASE}/api/auth/password-reset/forgot/confirm`, {code}, await passwordConfig(),);
        },
        passwordResetForgotReset: async (password: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/password-reset/forgot/reset`,
                {password},
                await passwordConfig(),
            );
        },
        passwordResetForgotResetRepeat: async (passwordRepeat: string) => {
            return apiClient.post(
                `${API_BASE}/api/auth/password-reset/forgot/reset/repeat`,
                {passwordRepeat},
                await passwordConfig(),
            );
        },
    },

    updateTimezone: async (payload: UpdateTimezonePayload) => {
        return apiClient.post<UpdateTimezoneResponse>(
            `${API_BASE}/api/medicines/update-timezone`,
            payload,
            {requiresAuth: true},
        );
    },

    getTimezone: async () => {
        return apiClient.get<PatientTimezoneResponse>(
            `${API_BASE}/api/medicines/update-timezone`,
            {requiresAuth: true},
        );
    },

    pushNotifications: {
        registerFcmToken: async (payload: PushTokenPayload) => {
            return apiClient.post<RegisterFcmTokenResponse>(
                `${API_BASE}/api/notifications/push-tokens/fcm`,
                payload,
                {requiresAuth: true},
            );
        },
        sendTestPush: async (payload: SendTestPushPayload) => {
            return apiClient.post<SendTestPushResponse>(
                `${API_BASE}/api/notifications/test/push`,
                payload,
                {requiresAuth: true},
            );
        },
    },
}
