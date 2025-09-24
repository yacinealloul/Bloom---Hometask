export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const E2B_API_KEY: string | undefined = process.env.E2B_API_KEY;
export const E2B_TEMPLATE_ID: string | undefined = process.env.E2B_TEMPLATE_ID 
