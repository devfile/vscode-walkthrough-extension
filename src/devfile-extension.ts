/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import * as vscode from 'vscode';
import { DevfileExtension, NewCommand, NewContainer, NewEndpoint, NewEnvironmentVariable, SaveDevfile } from './model/extension-model';
import { inject, injectable } from 'inversify';
import { initBindings } from './bindings';
import { InstallYaml } from './command/install-yaml';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const container = initBindings();
    container.get(DevfileExtensionImpl).start(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }

@injectable()
export class DevfileExtensionImpl implements DevfileExtension {

    @inject(NewContainer)
    private newContainer: NewContainer;

    @inject(NewEndpoint)
    private newEndpoint: NewEndpoint;

    @inject(NewEnvironmentVariable)
    private newEnvironmentVariable: NewEnvironmentVariable;

    @inject(NewCommand)
    private newCommand: NewCommand;

    @inject(InstallYaml)
    private installYaml: InstallYaml;

    public async start(context: vscode.ExtensionContext): Promise<void> {
        context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-container', async () => this.newContainer.run()));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-endpoint', async () => this.newEndpoint.run()));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-environment-variable', async () => this.newEnvironmentVariable.run()));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-command', async () => this.newCommand.run()));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.install-yaml', async () => this.installYaml.run()));
    }

}
