const Config = require("./config");
const IssuesProvider = require("./provider");
const Formatter = require("./Formatter");

exports.activate = function() {
    const config = new Config();
    const issueCollection = new IssueCollection("ruff");
    const issuesProvider = new IssuesProvider(config, issueCollection);
    const formatter = new Formatter(config);

    console.info("Executable path: " + config.get("executablePath"));
    console.info("Command (check) arguments: " + config.get("commandArguments"));
    console.info("Check mode: " + config.get("checkMode"));
    console.info("Command (format) arguments: " + config.get("commandFormatArguments"));
    console.info("Format on save: " + config.get("formatOnSave"));

    var assistant = null;

    for (c of [nova.config, nova.workspace.config]) {
        c.observe("cc.aeron.nova-ruff.checkMode", () => {
            if (assistant) {
                assistant.dispose();
                assistant = null;
            }

            const checkMode = config.get("checkMode");

            if (checkMode !== "-") {
                assistant = nova.assistants.registerIssueAssistant(
                    "python", issuesProvider, {"event": checkMode}
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
        if (editor.document.syntax !== "python") return;
        editor.onWillSave(formatter.getPromiseToFormat, formatter);
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
