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
import { NewContainer, NewEnvironmentVariable, SaveDevfile } from "../model/extension-model";

@injectable()
export class NewEnvironmentVariableImpl implements NewEnvironmentVariable {

	@inject(DevfileService)
    private service: DevfileService;

	@inject(NewContainer)
	private newContainer: NewContainer;

    @inject(SaveDevfile)
	private saveDevfile: SaveDevfile;

    async run(): Promise<boolean> {
        log('NewEnvironmentVariable::run()');

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

			log('>> adding an environment variable...');

            const environmentVariable = await this.defineEnvironmentVariable();
            if (environmentVariable) {
                await this.saveDevfile.onDidDevfileUpdate().then(value => {
                    log(`>>>> Devfile Updated: ${value}`);
                });

                vscode.window.showInformationMessage(`Environmane '${environmentVariable.name}' has been created successfully`, 'Open Devfile').then(value => {
                    log('>>>> USER ANSWERED ' + value);
                });
                return true;
            }

            log('<< canceled');

        } catch (err) {
            log(`ERROR occured: ${err.message}`);
        }

        return false;
    }

    private async defineEnvironmentVariable(): Promise<devfile.EnvironmentVariable | undefined> {
        log('');
        log('>> defineEvironmentVariable ....');

        // select component container
        const component = await this.selectComponent();
        if (!component) {
			return undefined;
        }

        log(`> component ${component.name}`);

        // enter name
        const name = await this.enterEnvironmentVariableName(component);
        log(`> name ${name}`);
        if (!name) {
            return undefined;
        }

        const value = await this.enterEnvironmentVariableValue();
        // empty value is allowed
		if (value === undefined) {
			log('<< value is UNDEFINED');
			return undefined;
		}

        const environmentVariable: devfile.EnvironmentVariable = {
            name,
            value
        };

        if (!component.container.env) {
            component.container.env = [];
        }

        component.container.env.push(environmentVariable);
        return environmentVariable;
    }

	/**
	 * Asks user to select a container for the endpoint
	 */
    private async selectComponent(): Promise<devfile.Component | undefined> {
        const componentNames: string[] = this.service.getDevfile().components
            .filter(c => c.container)
            .map<string>(c => c.name);

		const componentName = await vscode.window.showQuickPick(componentNames, {
			title: 'Select a component container',
		});

        return this.service.getDevfile().components
            .find(c => c.name === componentName);
    }

    /**
     * Ask user to enter environment variable name
     */
    private async enterEnvironmentVariableName(component: devfile.Component): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: 'WELCOME',
			title: 'Environment Variable Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!value) {
					return {
						message: 'Environment variable name cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
				
                if (component.container && component.container.env) {
                    if (component.container.env.find(e => e.name === value)) {
                        return {
                            message: 'Enviroment variable with this name already exists',
                            severity: vscode.InputBoxValidationSeverity.Error
                        } as vscode.InputBoxValidationMessage;
                    }
                }
                
				return undefined;
			}
		});
    }

    private async enterEnvironmentVariableValue(): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: 'Hello World',
			title: 'Environment Variable Value'
		});
    }

}
