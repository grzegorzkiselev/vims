import { Dispatcher } from "../Dispatcher";

export const vscodeCommands: {
  key: string, command: string, when: string, action: (this: Dispatcher) => void
}[] = [{
  key: "ctrl+o",
  command: "vims.escape",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode == 'INSERT'",
  action() {
    this.ActionNativeEscape.press();
    this.ActionSelection.shrinkToActives().then((isShrunken) =>
      isShrunken ? Promise.resolve(true) : this.ActionMode.toNormal(),
    );
  },
},
{
  key: "i",
  command: "vims.i",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("i");
  },
},
{
  key: "shift+i",
  command: "vims.I",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("I");
  },
},
{
  key: "a",
  command: "vims.a",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("a");
  },
},
{
  key: "shift+a",
  command: "vims.A",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("A");
  },
},
{
  key: "o",
  command: "vims.o",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("o");
  },
},
{
  key: "/",
  command: "vims.find",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("/");
  },
},
{
  key: "r",
  command: "vims.r",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("r");
  },
},
{
  key: "shift+o",
  command: "vims.O",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("O");
  },
},
{
  key: "s",
  command: "vims.s",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("s");
  },
},
{
  key: "x",
  command: "vims.x",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("x");
  },
},
{
  key: "shift+x",
  command: "vims.X",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("X");
  },
},
{
  key: "d",
  command: "vims.d",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("d");
  },
},
{
  key: "c",
  command: "vims.c",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("c");
  },
},
{
  key: "left",
  command: "vims.left",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("h");
  },
},
{
  key: "down",
  command: "vims.down",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("j");
  },
},
{
  key: "up",
  command: "vims.up",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("k");
  },
},
{
  key: "right",
  command: "vims.right",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("l");
  },
},
{
  key: "n",
  command: "vims.n",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("n");
  },
},
{
  key: "shift+n",
  command: "vims.N",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("N");
  },
},
{
  key: "shift+8",
  command: "vims.*",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("*");
  },
},
{
  key: "shift+3",
  command: "vims.#",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("#");
  },
},

{
  key: "shift+d",
  command: "vims.D",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("D");
  },
},
{
  key: "shift+c",
  command: "vims.C",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("C");
  },
},
{
  key: "shift+s",
  command: "vims.S",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("S");
  },
},
{
  key: "shift+j",
  command: "vims.J",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("J");
  },
},
{
  key: "w",
  command: "vims.w",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("w");
  },
},
{
  key: "shift+w",
  command: "vims.W",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("W");
  },
},
{
  key: "e",
  command: "vims.e",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("e");
  },
},
{
  key: "shift+e",
  command: "vims.E",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("e");
  },
},
{
  key: "b",
  command: "vims.b",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("b");
  },
},
{
  key: "shift+b",
  command: "vims.B",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("B");
  },
},
{
  key: "shift+g",
  command: "vims.g",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("g");
  },
},
{
  key: "shift+G",
  command: "vims.G",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("G");
  },
},
{
  key: "space",
  command: "vims.space",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("space");
  },
},
{
  key: "backspace",
  command: "vims.backspace",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("backspace");
  },
},
{
  key: "f",
  command: "vims.f",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("f");
  },
},
{
  key: "shift+f",
  command: "vims.F",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("F");
  },
},
{
  key: "t",
  command: "vims.t",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("t");
  },
},
{
  key: "shift+4",
  command: "vims.;",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(";");
  },
},
{
  key: ",",
  command: "vims.,",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(",");
  },
},
{
  key: "shift+5",
  command: "vims.%",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("%");
  },
},
{
  key: "[Quote]",
  command: "vims.^",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("^");
  },
},
{
  key: "0",
  command: "vims.0",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("0");
  },
},
{
  key: "[Semicolon]",
  command: "vims.$",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("$");
  },
},
{
  key: "-",
  command: "vims.-",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("-");
  },
},
{
  key: "shift+=",
  command: "vims.+",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("+");
  },
},
{
  key: "shift+-",
  command: "vims._",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("_");
  },
},
{
  key: "shift+[",
  command: "vims.{",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("{");
  },
},
{
  key: "shift+]",
  command: "vims.}",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("}");
  },
},
{
  key: "delete",
  command: "vims.delete",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("delete");
  },
},
{
  key: "shift+r",
  command: "vims.R",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("R");
  },
},
{
  key: "shift+`",
  command: "vims.~",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("~");
  },
},
{
  key: "y",
  command: "vims.y",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("y");
  },
},
{
  key: "shift+y",
  command: "vims.Y",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("Y");
  },
},
{
  key: "p",
  command: "vims.p",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("p");
  },
},
{
  key: "shift+p",
  command: "vims.P",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("P");
  },
},
{
  key: "=",
  command: "vims.=",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("=");
  },
},
{
  key: "u",
  command: "vims.u",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("u");
  },
},
{
  key: "shift+.",
  command: "vims.>",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(">");
  },
},
{
  key: "shift+,",
  command: "vims.<",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("<");
  },
},
{
  key: "/",
  command: "vims./",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("/");
  },
},
{
  key: "v",
  command: "vims.v",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("v");
  },
},
{
  key: "shift+v",
  command: "vims.V",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("V");
  },
},
{
  key: "z",
  command: "vims.z",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("z");
  },
},
{
  key: ".",
  command: "vims..",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(".");
  },
},
{
  key: ".",
  command: "vims..",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(".");
  },
},
{
  key: "shift+m",
  command: "vims.M",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("M");
  },
},
{
  key: "shift+6",
  command: "vims.:",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input(":");
  },
},
{
  key: "backspace",
  command: "vims.backspace",
  when: "vims.isLoaded == true && editorTextFocus && vims.mode != 'INSERT'",
  action() {
    this._currentMode.input("backspace");
  },
}
  ];

export const exportShortcuts = vscodeCommands.map(({ key, command, when }) => {
  return { key, command, when };
});
