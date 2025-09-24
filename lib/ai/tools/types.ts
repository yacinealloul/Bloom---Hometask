export type AgentAction = {
    type: "write_file" | "read_file" | "list_dir" | "run" | "install_package" | "patch_file" | "remove_file";
    path?: string;
    content?: string;
    patch?: string;
    command?: string;
    background?: boolean;
    recursive?: boolean;
    depth?: number;
    pkg?: string;
    packages?: string[];
    dev?: boolean;
    status?: "pending" | "in_progress" | "completed" | "failed";
};

export type AgentPayload = {
    thoughts?: string | null;
    actions: AgentAction[];
};

export type LogWriter = {
    push: (chunk: string) => void;
    flush: () => Promise<void>;
};

export type ExecuteContext = {
    sandbox: any; // E2B Sandbox type
    log: LogWriter;
    readFiles?: Map<string, string>; // Track read files for iterative context
};

export type ToolResult = {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
};

export type SandboxConfig = {
    apiKey: string;
    timeout: number;
    rootPath: string;
    maxActions: number;
};
