const utils = require("./utils");

class Formatter {
    constructor(config) {
        this.config = config;
    }

    getProcessOptions(filename = null) {
        const defaultOptions = (filename)
            ? (filename !== ".")
                ? ["--quiet", `--stdin-filename=${filename}`, "-"]
                : ["--quiet", filename]
            : ["--quiet", "-"];

        const commandArguments = this.config.commandFormatArguments();
        const extraOptions = utils.normalizeOptions(commandArguments);

        return Array.from(new Set([...extraOptions, ...defaultOptions]));
    }

    getProcess(filename = null) {
        const executablePath = nova.path.expanduser(this.config.executablePath());

        if (!nova.fs.stat(executablePath)) {
            console.error(`Executable ${executablePath} does not exist`);
            return;
        }

        const options = this.getProcessOptions(filename);

        return new Process(
            executablePath,
            {
                args: ["format", ...options],
                stdio: "pipe",
                cwd: nova.workspace.path,  // NOTE: must be explicitly set
            }
        );
    }

    provideFormat(editor) {
        return new Promise((resolve, reject) => this.format(editor, resolve, reject));
    }

    format(editor, resolve = null, reject = null) {
        if (editor.document.isEmpty) {
            if (reject) reject("empty file");
            return;
        }

        let process = this.getProcess(
            editor.document.path ? nova.path.basename(editor.document.path) : null
        );

        if (!process) {
            if (reject) reject("no process");
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);
        const filePath = nova.workspace.relativizePath(editor.document.path);

        let outBuffer = [];
        let errBuffer = [];

        process.onStdout((output) => outBuffer.push(output));
        process.onStderr((error) => errBuffer.push(error));
        process.onDidExit((status) => {
            if (status === 0) {
                const formattedContent = outBuffer.join("");

                let result = editor.edit((edit) => {
                    if (formattedContent !== content) {
                        console.log("Formatting " + filePath);
                        edit.replace(textRange, formattedContent, InsertTextFormat.PlainText);
                    } else {
                        console.log("Nothing to format");
                    }
                });

                if (resolve) resolve(result);
            } else {
                console.error(errBuffer.join(""));
                if (reject) reject();
            }
        });

        console.log("Running " + process.command + " " + process.args.join(" "));

        process.start();

        let writer = process.stdin.getWriter();

        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }

    formatWorkspace() {
        let process = this.getProcess(".");

        if (!process) {
            return;
        }

        let errBuffer = [];

        process.onStderr((error) => errBuffer.push(error));
        process.onDidExit((status) => {
            if (status === 0) {
                console.log("Formatting the workspace");
            } else {
                console.error(errBuffer.join(""));
            }
        });

        console.log("Running " + process.command + " " + process.args.join(" "));

        process.start();
    }
}

module.exports = Formatter;
