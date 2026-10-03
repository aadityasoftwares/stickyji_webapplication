export const AUTH_MESSAGES = {
    SUCCESS: {
        SIGNED_IN: 'Your notes are ready when you are.',
        ACCOUNT_CREATED: 'Your workspace has been created.',
        PASSWORD_RESET: 'Your password has been reset successfully.',
        RESET_LINK_REQUESTED_AGAIN: 'A new password reset link has been requested.',
        RESET_INSTRUCTIONS_SENT: 'Password reset instructions are on the way.',
    },
    ERROR: {
        SIGN_IN_FAILED: 'We could not sign you in. Please try again.',
        SIGN_UP_FAILED: 'We could not create your account. Please try again.',
        RESET_FAILED: 'We could not reset your password.',
        RESET_EMAIL_FAILED: 'We could not send the reset email.',
    },
} as const;
