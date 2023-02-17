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
import { NewCommand, NewContainer, SaveDevfile } from "../model/extension-model";
import { countContainerComponents } from "./util";

@injectable()
export class NewCommandImpl implements NewCommand {

	@inject(DevfileService)
    private service: DevfileService;

	@inject(NewContainer)
	private newContainer: NewContainer;

	@inject(SaveDevfile)
	private saveDevfile: SaveDevfile;

	private idCounter = 0;

    async run(): Promise<boolean> {
		log('NewCommandImpl::run()');

		try {
			if (!await this.newContainer.ensureAtLeastOneContainerExist()) {
				log('NewCommandImpl >> container is not created');
				return;
			}

			// const containerComponents = countContainerComponents(this.service.getDevfile());
			// if (containerComponents === 0) {
			// 	await vscode.window.showErrorMessage('Something went wrong!');
			// 	return false;
			// }

			log('>> adding a command...');
			const command = await this.defineCommand();
			if (command) {
				if (!this.service.getDevfile().commands) {
					this.service.getDevfile().commands = [];
				}

				this.service.getDevfile().commands.push(command);
				
				await this.saveDevfile.onDidDevfileUpdate();
				vscode.window.showInformationMessage(`Command '${command.id}' has been created successfully`, 'Open Devfile');
				return true;
			}

			log('<< canceled');

        } catch (err) {
            log(`ERROR occured: ${err.message}`);
        }

		return false;
    }

	private async defineCommand(): Promise<devfile.Command | undefined> {
		log('NewCommandImpl::defineCommand()');

		const label = await this.enterLabel();
		log(`>> label ${label}`);
		if (!label) {
			return undefined;
		}

		const component = await this.selectComponent();
		log(`>> component ${component}`);
		if (!component) {
			return undefined;
		}

		const commandLine = await this.enterCommandLine();
		log(`>> command line ${commandLine}`);
		if (!commandLine) {
			return undefined;
		}

		// form command ID
		let commandID;
		do {
			this.idCounter++;
			commandID = `command-${this.idCounter}`;
		} while (this.isCommandExist(commandID));

		return {
			id: commandID,
			exec: {
				label,
				component,
				commandLine,
				workingDir: '${PROJECT_SOURCE}'
			}
		};
	}

	/**
	 * Asks user for the command label
	 */
	private async enterLabel(): Promise<string> {
		return await vscode.window.showInputBox({
			value: 'Sample Command',
			title: 'Add Command Label',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'Command label cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				const commands = this.service.getDevfile().commands;
				if (commands) {
					for (const c of commands) {
						if (c.exec.label && c.exec.label === value) {
							return {
								message: 'A command with this label alredy exists',
								severity: vscode.InputBoxValidationSeverity.Error
							} as vscode.InputBoxValidationMessage;
						}
					}

				}

				return undefined;
			}

		});
	}

	/**
	 * Asks user for the component to run
	 */
	private async selectComponent(): Promise<string> {
		const componentNames: string[] = [];
		for (const c of this.service.getDevfile().components) {
			// take only container component
			if (c.container) {
				componentNames.push(c.name);
			}
		}

		return await vscode.window.showQuickPick(componentNames, {
			title: 'Select a component in which the command will be executed',
		});
	}

	/**
	 * Asks user to enter command line
	 */
	private async enterCommandLine(): Promise<string> {
		return await vscode.window.showInputBox({
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
	}

	private isCommandExist(id: string): boolean {
		const devfile = this.service.getDevfile();
		if (!devfile.commands) {
			return false;
		}

		for (const command of devfile.commands) {
			if (command.id === id) {
				return true;
			}
		}

		return false;
	}

}
