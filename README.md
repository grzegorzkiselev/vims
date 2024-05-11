# vims for VS Code

![icon](images/icon.png)

The [Vim](http://www.vim.org/) mode for [Visual Studio Code](https://code.visualstudio.com/) that works as expected.


## Key features

- Vim style keybindings & looks
- Normal, Visual and Visual Line modes support
- Multi-cursor support
- Works with VS Code's default behaviors


## Not supported

- `:` started commands: Only a few are supported now.
- Visual Block mode: Please use multi-cursor instead for now.
- Custom keybindings: On the roadmap.


## Commands

Check the list [here](https://github.com/aioutecism/vims-for-VSCode/issues/1).


## Configuration

You can override default configurations in
[User and Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings).

#### `vims.bindCtrlCommands`

`Boolean`, Default: `true`

Set to `false` to disable `Ctrl+<key>` keybindings.

#### `vims.mimicVimSearchBehavior`

`Boolean`, Default: `true`

Set to `false` to keep VSCode's keybinding when searching.

#### `vims.startInInsertMode`

`Boolean`, Default: `false`

Set to `true` to start in Insert mode when opening files.

#### `vims.smartRelativeLineNumbers`

`Boolean`, Default: `false`

Set to `true` to will make line numbers relative when not in Insert mode.

#### `vims.useSystemClipboard`

`Boolean`, Default: `false`

Set to `true` to copy to and paste from the system clipboard.

#### `vims.vimStyleNavigationInListView`

`Boolean`, Default: `true`

Set to `false` to disable Vim style navigation in sidebar.


## Contexts

You can make use of 
[when clause contexts](https://code.visualstudio.com/api/references/when-clause-contexts)
to construct keybindings that only apply in specific scenarios.

#### `vims.mode`

`String`, Possible values: `NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`

Tracks the current editing mode. For backward compatibility, `REPLACE` mode will appear as `INSERT`.

#### `vims.waitingForInput`

`Boolean`

Set to `true` when vims is waiting for further input to match a command, otherwise `false`.
This can be used to set up keybindings that perform a custom function when keys are pressed
independently, without overriding the default Vim style behavior for those keys when
prefixed.

For example, the following configuration will redefine Vim style navigation keys `j` and `k`
to move the native cursor, stepping over folded code and stepping into wrapped lines, while
still allowing longer Vim commands like `3j` to work as expected:

```json
[
  {
    "key": "j",
    "command": "cursorDown",
    "when": "editorTextFocus && vims.mode == 'NORMAL' && !vims.waitingForInput"
  },
  {
    "key": "k",
    "command": "cursorUp",
    "when": "editorTextFocus && vims.mode == 'NORMAL' && !vims.waitingForInput"
  }
]
```


## Contributing

Feel free to open [issues][] to report bugs or require features.

[Pull requests][] are welcomed too! See VS Code's official instructions about:

- [Extension API][]
- [Testing Extensions][]
  - Protip: change `suite(` to `suite.only(` in a test file to run only a
    single test suite at a time. This saves quite a lot of time. Remember to
    remove the `.only` part before making a Git commit.

[issues]: https://github.com/aioutecism/vims-for-VSCode/issues
[Pull requests]: https://github.com/aioutecism/vims-for-VSCode/pulls
[Extension API]: https://code.visualstudio.com/api
[Testing Extensions]: https://code.visualstudio.com/api/working-with-extensions/testing-extension
