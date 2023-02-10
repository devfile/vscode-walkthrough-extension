import * as vscode from 'vscode';

let output: vscode.OutputChannel | undefined = undefined;

export function log(msg: string) {
    if (!output) {
        output = vscode.window.createOutputChannel('devfile-extension');
        output.show(true);
    }

    output?.appendLine(msg);
}
