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
import { log } from './logger';
import { DevfileExtension } from './extension-model';
import { inject, injectable } from 'inversify';
import { NewDevfile } from './command/new-devfile';
import { SaveDevfile } from './command/save-devfile';
import { initBindings } from './bindings';
import { NewComponent } from './command/new-component';
import { NewCommand } from './command/new-command';

export async function activate(context: vscode.ExtensionContext): Promise<void> {

	const container = initBindings();
	container.get(DevfileExtensionImpl).start(context);

	log('>> extension has been started!');
}

// This method is called when your extension is deactivated
export function deactivate() { }

@injectable()
export class DevfileExtensionImpl implements DevfileExtension {

	@inject(NewDevfile)
	private newDevfile: NewDevfile;

	@inject(NewComponent)
	private newComponent: NewComponent;

	@inject(NewCommand)
	private newCommand: NewCommand;

	@inject(SaveDevfile)
	private saveDevfile: SaveDevfile;

	constructor() {}

	public async start(context: vscode.ExtensionContext): Promise<void> {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-devfile', async () => this.newDevfile.run()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-component', async () => this.newComponent.run()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-command', async () => this.newCommand.run()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.save-devfile', async () => this.saveDevfile.run()));
	}

}
