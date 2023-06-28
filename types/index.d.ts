export interface PluginUserOptions {
    input?: string[]
    files?: string[]
}

export default function plugin(options?: PluginUserOptions) : import('vite').Plugin
