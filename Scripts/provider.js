const utils = require("./utils");

class IssueProvider {
    constructor(config) {
        this.config = config;
        this.issueCollection = new IssueCollection("ruff");
        this.parser = new IssueParser("ruff");
    }

    getProcessOptions(fixable = null, select = null) {
        const defaultOptions = ["--output-format=github", "--quiet", "-"];
        const commandArguments = this.config.commandArguments();
        const extraOptions = utils.normalizeOptions(commandArguments);

        const fixOptions = (fixable)
            ? [`--fixable=${fixable}`, "--fix"]
            : (select)
                ? [`--select=${select}`, "--fix"]
                : [];

        return Array.from(new Set([...extraOptions, ...fixOptions, ...defaultOptions]));
    }

    getProcess(fixable = null, select = null) {
        const executablePath = nova.path.expanduser(this.config.executablePath());

        if (!nova.fs.stat(executablePath)) {
            console.error(`Executable ${executablePath} does not exist`);
            return;
        }

        const options = this.getProcessOptions(fixable, select);

        return new Process(
            executablePath,
            {
                args: ["check", ...options],
                stdio: "pipe",
                cwd: nova.workspace.path,  // NOTE: must be explicitly set
            }
        );
    }

    provideIssues(editor) {
        return new Promise((resolve, reject) => this.check(editor, resolve, reject));
    }

    check(editor, resolve = null, reject = null) {
        if (editor.document.isEmpty) {
            if (reject) reject("empty file");
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);
        const filePath = (editor.document.path)
            ? nova.workspace.relativizePath(editor.document.path)
            : editor.document.uri;

        const process = this.getProcess();

        if (!process) {
            if (reject) reject("no process");
            return;
        }

        process.onStdout((output) => this.parser.pushLine(output));
        process.onStderr((error) => console.error(error));
        process.onDidExit((status) => {
            console.info(`Checking ${filePath}`);

            // NOTE: Nova version 1.2 and prior has a known bug
            if (nova.version[0] === 1 && nova.version[1] <= 2) {
                for (let issue of this.parser.issues) {
                    issue.line += 1;
                    issue.column += 1;
                }
            }

            console.info(`Found ${this.parser.issues.length} issue(s)`);

            this.issueCollection.set(editor.document.uri, this.parser.issues);
            this.parser.clear();

            // HACK: nova.assistants.registerIssueAssistant uses its own private and
            // nameless IssueCollection, and that leads to issue duplication between
            // the command and on-save check. So, we give it nothing, and keep using
            // our explicit IssueCollection.
            if (resolve) resolve();
        });

        console.info(`Running ${process.command} ${process.args.join(" ")}`);

        process.start();

        const writer = process.stdin.getWriter();

        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }

    fix(editor, fixable = null, select = null) {
        if (editor.document.isEmpty) {
            if (reject) reject("empty file");
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);
        const filePath = (editor.document.path)
            ? nova.workspace.relativizePath(editor.document.path)
            : editor.document.uri;

        const process = this.getProcess(fixable, select);

        if (!process) {
            return;
        }

        let outBuffer = [];
        let errBuffer = [];

        process.onStdout((output) => outBuffer.push(output));
        process.onStderr((error) => errBuffer.push(error));
        process.onDidExit((status) => {
            const fixedContent = outBuffer.join("");

            let result = editor.edit((edit) => {
                if (fixedContent !== content) {
                    console.info(`Fixing ${filePath}`);
                    edit.replace(textRange, fixedContent, InsertTextFormat.PlainText);
                } else {
                    console.log("Nothing to fix");
                }
            });
        });

        console.info(`Running ${process.command} ${process.args.join(" ")}`);

        process.start();

        const writer = process.stdin.getWriter();

        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }
}

module.exports = IssueProvider;
