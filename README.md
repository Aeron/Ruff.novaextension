# Ruff Nova Extension

It’s a stand-alone [Nova][nova-url] extension to use [Ruff][ruff-url], an extremely
fast Python linter (and formatter), written in Rust.

[nova-url]: https://nova.app
[ruff-url]: https://github.com/charliermarsh/ruff

## Requirements

Before using the extension, it’s necessary to install Ruff itself if you don’t
have one already.

Ruff can be installed simply by running `pip install ruff`.

## Configuration

The extension supports both global and workspace configurations. A workspace
configuration always overrides a global one.

### Options

There are few options available to configure: executable path, check command arguments,
and check mode, format command arguments, and format on save. By default, the executable
path is `/usr/local/bin/ruff`, with no additional arguments, checking on change, and
formatting on save.

You could alter the executable path if Ruff installed in a different place
or if `/usr/bin/env` usage is desirable.

In the case of `/usr/bin/env`, it becomes the executable path, and `ruff` becomes
the first argument.

### pyproject.toml

The extension respects `pyproject.toml`, `ruff.toml`, and `.ruff.toml` in a project
directory as much as `ruff` command-line utility. So, there’s no need to specify the
`--config` argument explicitly.
