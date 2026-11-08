"use client";

/**
 * OAuth buttons following official brand guidelines:
 * - Google: https://developers.google.com/identity/branding-guidelines
 * - Apple: Sign in with Apple HIG (black button + logo + approved CTA)
 */

function GoogleG({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M16.365 1.43c0 1.14-.43 2.2-1.2 3.02-.92.98-2.22 1.55-3.4 1.45-.14-1.1.42-2.26 1.16-3.04.9-.98 2.4-1.66 3.44-1.68zM20.9 17.4c-.55 1.26-.81 1.82-1.52 2.94-.99 1.55-2.38 3.48-4.11 3.49-1.54.02-1.94-.99-4.04-.97-2.1.01-2.54 1-4.08.98-1.73-.02-3.05-1.76-4.04-3.31C1.1 17.35-.3 12.2 1.82 8.72c1.05-1.73 2.72-2.82 4.61-2.85 1.72-.03 3.34 1.16 4.04 1.16.7 0 2.53-1.43 4.27-1.22.73.03 2.78.29 4.09 2.2-3.57 1.97-3 6.7.07 9.39z" />
    </svg>
  );
}

type Props = {
  loading?: boolean;
  onGoogle: () => void;
  onApple: () => void;
};

export function OAuthButtons({ loading, onGoogle, onApple }: Props) {
  return (
    <div className="space-y-2.5">
      {/* Google — light theme per Identity branding guidelines */}
      <button
        type="button"
        disabled={loading}
        onClick={onGoogle}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-[10px] border border-[#747775] bg-white px-3 text-[15px] font-medium text-[#1F1F1F] hover:bg-[#F8F9FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-white">
          <GoogleG />
        </span>
        Continue with Google
      </button>

      {/* Apple — black button + white logo (Sign in with Apple HIG) */}
      <button
        type="button"
        disabled={loading}
        onClick={onApple}
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-black bg-black px-3 text-[15px] font-medium text-white hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        <AppleLogo className="size-[18px] -mt-0.5" />
        Continue with Apple
      </button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="text-[12px] font-medium tracking-wide text-muted uppercase">
          or email
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
    </div>
  );
}
