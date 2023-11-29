import { dirname, join, resolve } from 'node:path'
import fs from 'node:fs'
import FastGlob from 'fast-glob'

/**
 * @param {import('@vituum/vite-plugin-concat/types').PluginUserOptions} userOptions
 * @returns {import('vite').Plugin}
 */
const plugin = (userOptions) => {
    const options = {
        input: [],
        files: [],
        ...userOptions
    }

    let resolvedConfig

    const importJs = path => {
        let content = fs.readFileSync(path, {
            encoding: 'utf8'
        })

        content = content.replace(/import\s["'](.*\.js)["']/gi, (match, fileName) => {
            const importPath = join(dirname(path), fileName)
            return importJs(importPath)
        })

        return content
    }

    const resolvePaths = (files, rootPath) => {
        const resolvedFiles = {...files}
        Object.keys(files).forEach(input => {
            resolvedFiles[input] = files[input].map(entry => resolve(rootPath, entry))
        })
        return resolvedFiles
    }

    return {
        name: '@vituum/vite-plugin-concat',
        enforce: 'pre',
        configResolved (config) {
            resolvedConfig = config
            options.files = resolvePaths(options.files, resolvedConfig.root)
        },
        transform (code, path) {
            if (options.input.find(input => path.split('?')[0].endsWith(input))) {
                code = importJs(path.split('?')[0])

                const filesInput = Object.keys(options.files).find(input => path.split('?')[0].endsWith(input))

                if (filesInput) {
                    FastGlob.sync(options.files[filesInput]).forEach(entry => {
                        const file = fs.readFileSync(entry).toString()

                        code = code + '\n' + file
                    })
                }

                return {
                    code,
                    map: null
                }
            }

            return {
                code,
                map: null
            }
        },
        transformIndexHtml: {
            async transform (content, { server }) {
                if (server) {
                    options.input.forEach(input => {
                        content = content.replace(input, `${input}?v=${Date.now().toString(36)}`)
                    })

                    return content
                }
            }
        }
    }
}

export default plugin
