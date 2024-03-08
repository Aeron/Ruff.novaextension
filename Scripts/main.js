const Config = require("./config");
const IssuesProvider = require("./provider");
const Formatter = require("./Formatter");

exports.activate = function () {
    const issueCollection = new IssueCollection("ruff");
    const issuesProvider = new IssuesProvider(Config, issueCollection);
    const formatter = new Formatter(Config);

    console.info(`Executable path: ${Config.executablePath()}`);
    console.info(`Command (check) arguments: ${Config.commandArguments()}`);
    console.info(`Check mode: ${Config.checkMode()}`);
    console.info(`Command (format) arguments: ${Config.commandFormatArguments()}`);
    console.info(`Format on save: ${Config.formatOnSave()}`);

    var assistant = null;

    for (c of [nova.config, nova.workspace.config]) {
        c.observe(`${nova.extension.identifier}.checkMode`, () => {
            if (assistant) {
                assistant.dispose();
                assistant = null;
            }

            const checkMode = Config.checkMode();

            if (checkMode !== "-") {
                assistant = nova.assistants.registerIssueAssistant(
                    "python", issuesProvider, { "event": checkMode }
                );
            }
        });
    }

    nova.commands.register("checkWithRuff", (editor) => {
        issuesProvider.check(editor, (issues) => {
            issueCollection.set(editor.document.uri, issues);
        });
    });

    nova.workspace.onDidAddTextEditor((editor) => {
        if (editor.document.syntax !== "python" || !Config.formatOnSave()) return;
        editor.onWillSave(formatter.provideFormat, formatter);
    });

    nova.commands.register("formatWithRuff", formatter.format, formatter);
    nova.commands.register(
        "formatWorkspaceWithRuff", formatter.formatWorkspace, formatter
    );
    nova.commands.register("fixWithRuff", (editor) => {
        issuesProvider.fix(editor, "ALL", null);
    });
    nova.commands.register("organizeWithRuff", (editor) => {
        issuesProvider.fix(editor, null, "I001");
    });
}
