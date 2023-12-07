class IssuesProvider {
    constructor(config, issueCollection) {
        this.config = config;
        this.issueCollection = issueCollection;
    }

    async getProcess(fixable=null, select=null) {
        const executablePath = nova.path.expanduser(this.config.get("executablePath"));
        const commandArguments = this.config.get("commandArguments");
        const defaultOptions = ["--output-format=github", "--quiet", "-"];

        if (!nova.fs.stat(executablePath)) {
            console.error(`Executable ${executablePath} does not exist`);
            return;
        }

        const fixOptions = (fixable)
            ? ["--fixable", fixable, "--fix"]
            : (select)
                ? ["--select", select, "--fix"]
                : [];

        var options = [];

        if (commandArguments) {
            options = commandArguments
                .replaceAll("\n", " ")
                .split(" ")
                .map((option) => option.trim())
                .filter((option) => option !== " ");
        }

        options = [...options, ...fixOptions, ...defaultOptions].filter(
            (option) => option !== ""
        );

        return new Process(
            executablePath,
            {
                args: ["check", ...Array.from(new Set(options))],
                stdio: "pipe",
                cwd: nova.workspace.path,  // NOTE: must be explicitly set
            }
        );
    }

    async provideIssues(editor) {
        this.issueCollection.clear();
        return new Promise((resolve, reject) => this.check(editor, resolve, reject));
    }

    async check(editor, resolve=null, reject=null) {
        if (editor.document.isEmpty) {
            if (reject) reject("empty file");
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);
        const filePath = (editor.document.path)
            ? nova.workspace.relativizePath(editor.document.path)
            : editor.document.uri;

        const parser = new IssueParser("ruff");

        const process = await this.getProcess();

        if (!process) {
            if (reject) reject("no process");
            return;
        }

        process.onStdout((output) => parser.pushLine(output));
        process.onStderr((error) => console.error(error));
        process.onDidExit((status) => {
            console.info("Checking " + filePath);

            // NOTE: Nova version 1.2 and prior has a known bug
            if (nova.version[0] === 1 && nova.version[1] <= 2) {
                for (let issue of parser.issues) {
                    issue.line += 1;
                    issue.column += 1;
                }
            }

            console.info("Found " + parser.issues.length + " issue(s)");

            resolve(parser.issues);
            parser.clear();
        });

        console.info("Running " + process.command + " " + process.args.join(" "));

        process.start();

        const writer = process.stdin.getWriter();

        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }

    async fix(editor, fixable=null, select=null, resolve=null, reject=null) {
        if (editor.document.isEmpty) {
            if (reject) reject("empty file");
            return;
        }

        const textRange = new Range(0, editor.document.length);
        const content = editor.document.getTextInRange(textRange);
        const filePath = (editor.document.path)
            ? nova.workspace.relativizePath(editor.document.path)
            : editor.document.uri;

        const process = await this.getProcess(fixable, select);

        if (!process) {
            if (reject) reject("no process");
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
                    console.info("Fixing " + filePath);
                    edit.replace(textRange, fixedContent, InsertTextFormat.PlainText);
                } else {
                    console.log("Nothing to fix");
                }
            });

            if (resolve) resolve(result);
        });

        console.info("Running " + process.command + " " + process.args.join(" "));

        process.start();

        const writer = process.stdin.getWriter();

        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }
}

module.exports = IssuesProvider;
