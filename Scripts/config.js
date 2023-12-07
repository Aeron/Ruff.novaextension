class Config {
    get(key) {
        let global = nova.config.get(nova.extension.identifier + "." + key);
        let workspace = nova.workspace.config.get(nova.extension.identifier + "." + key);

        if (typeof global === "boolean" && typeof workspace == "number") {
            if (workspace === -1) workspace = null
            else workspace = Boolean(workspace)
        }

        if (workspace !== null && global !== workspace) return workspace;
        return global;
    }
}

module.exports = Config;
