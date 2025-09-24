"use client";

export default function Error({ error }: { error: Error & { digest?: string } }) {
    return (
        <div className="p-6 text-red-400">
            <div className="font-medium">Something went wrong</div>
            <div className="text-sm opacity-80">{error.message}</div>
        </div>
    );
}


