/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { inject, injectable } from "inversify";
import * as vscode from 'vscode';
import { log } from "../logger";
import * as devfile from "../devfile";
import { DevfileService } from "../devfile/devfile-service";

@injectable()
export class NewCommand {

	@inject(DevfileService)
    private service: DevfileService;

    async run(): Promise<void> {
		// the Devfile object should be already created
		if (!this.service.getDevfile()) {
			await vscode.window.showErrorMessage('The first you need to create a Devfile');
			return;
		}

		// user has alreadt created at least one container component
		let containerComponents = 0;
		for (const c of this.service.getDevfile().components) {
			if (c.container) {
				containerComponents++;
			}
		}

		if (containerComponents === 0) {
			await vscode.window.showErrorMessage('The first you need to create a component');
			true;
		}

		let askForCommand = false;

		while (await this.wantToAddCommand(askForCommand)) {
			askForCommand = true;

			log('>> add command');
			const command = await this.defineCommand();
			if (command) {
				this.service.getDevfile().commands.push(command);
			} else {
				log('<< canceled');
				break;
			}
		}
    }

	private async wantToAddCommand(askForCommand: boolean): Promise<boolean> {
		if (!askForCommand) {
			return true;
		}

		// if the Devfile has no command defined, we assume the user wants to add at least one
		log(`>>> commands: ${this.service.getDevfile().commands.length}`);
		if (this.service.getDevfile().commands.length === 0) {
			return true;
		}

		const answer = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: 'Would you like to add one more command?',
		});

		return 'Yes' === answer;
	}

	private async defineCommand(): Promise<devfile.Command | undefined> {
		const commands = this.service.getDevfile().commands;

		const id = await vscode.window.showInputBox({
			value: 'say-hello',
			title: 'Command Identifier',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'Command identifier cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				for (const c of commands) {
					if (c.id === value) {
						return {
							message: 'A command with this identifier alredy exists',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					}
				}

				return undefined;
			}

		});

		if (!id) {
			return undefined;
		}

		const componentNames: string[] = [];
		for (const c of this.service.getDevfile().components) {
			// take only container component
			if (c.container) {
				componentNames.push(c.name);
			}
		}

		const component = await vscode.window.showQuickPick(componentNames, {
			title: 'Select a component in which the command will be executed',
		});

		if (!component) {
			return undefined;
		}

		const commandLine = await vscode.window.showInputBox({
			value: 'echo "${WELCOME}"',
			title: 'Enter command line to be executed',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'Command line cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				return undefined;
			}

		});

		if (!commandLine) {
			return undefined;
		}

		const workingDir = await vscode.window.showInputBox({
			value: '${PROJECT_SOURCE}',
			title: 'Enter the working directory for your commnd',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'Working directory cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				return undefined;
			}
		});

		if (!workingDir) {
			return undefined;
		}

		return {
			id,
			component,
			commandLine,
			workingDir
		};
	}

}
