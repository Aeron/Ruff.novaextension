function normalizeOptions(args) {
    const options = (args)
        ? args
            .replaceAll("\n", " ") // NOTE: a string config key can contain newlines
            .split(" ")
            .map((option) => option.trim())
            .filter((option) => option !== "")
        : [];

    let result = [];

    for (const opt of options) {
        let lastIdx = result.length - 1;
        let lastResult = result[lastIdx];

        if (
            !opt.startsWith("-")
            && lastResult
            && lastResult.startsWith("-")
            && lastResult.length > 1
            && !lastResult.includes("=")
        ) {
            result[lastIdx] = (lastResult.startsWith("--"))
                ? lastResult + "=" + opt
                : lastResult + " " + opt;
        }
        else result.push(opt);
    }

    return result;
}

module.exports.normalizeOptions = normalizeOptions;
