import { window } from "vscode";

export class StatusBar {
  public static updateStatusBar(status): void {
    window.setStatusBarMessage(status);
  }
}