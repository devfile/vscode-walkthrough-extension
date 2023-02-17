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
import { log } from "../logger";
import { DevfileService } from "../devfile/devfile-service";
import { NewContainer, NewEndpoint, SaveDevfile } from "../model/extension-model";
import { countContainerComponents } from "./util";
import * as vscode from 'vscode';
import * as devfile from "../devfile";

@injectable()
export class NewEndpointImpl implements NewEndpoint {

	@inject(DevfileService)
    private service: DevfileService;

	@inject(NewContainer)
	private newContainer: NewContainer;

	@inject(SaveDevfile)
	private saveDevfile: SaveDevfile;

    async run(): Promise<boolean> {
		log('NewEndpointImpl::run()');

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

			log('>> adding an endpoint...');

            const endpoint = await this.defineEndpoint();
            if (endpoint) {
                await this.saveDevfile.onDidDevfileUpdate().then(value => {
                    log(`>>>> Devfile Updated: ${value}`);
                });

                vscode.window.showInformationMessage(`Endpoint '${endpoint.name}' has been created successfully`, 'Open Devfile').then(value => {
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

    private async defineEndpoint(): Promise<devfile.Endpoint | undefined> {
        log('');
        log('>> defineEndpoint ....');

        // select component container
        const component = await this.selectComponent();
        if (!component) {
			return undefined;
        }

        log(`> component ${component.name}`);

        // enter name
        const name = await this.enterEndpointName(component);
        log(`> name ${name}`);
        if (!name) {
            return undefined;
        }

        // enter port
        const targetPort = await this.enterTargetPort(component);
        log(`> port ${targetPort}`);
        if (!targetPort) {
            return undefined;
        }

        // enter exposure
        const exposure = await this.enterExposure();
        log(`> exposure ${exposure}`);

        const endpoint: devfile.Endpoint = {
            name,
            targetPort
        };

        switch (exposure) {
            case 'public':
                endpoint.exposure = 'public';
                break;
            case 'internal':
                endpoint.exposure = 'internal';
                break;
            case 'none':
                endpoint.exposure = 'none';
                break;
        }

        if (!component.container.endpoints) {
            component.container.endpoints = [];
        }

        component.container.endpoints.push(endpoint);

        return endpoint;
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
     * Ask user to enter endpoint name
     * Maximum 15 characters allowed
     */
    private async enterEndpointName(component: devfile.Component): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: 'http-server',
			title: 'Endpoint Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!value) {
					return {
						message: 'Endpoint name cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

                if (component.container && component.container.endpoints) {
                    if (component.container.endpoints.find(e => e.name === value)) {
                        return {
                            message: 'Endpoint with this name already exists',
                            severity: vscode.InputBoxValidationSeverity.Error
                        } as vscode.InputBoxValidationMessage;
                    }
                }
                
                // check length <= 15 characters
                if (value.length > 15) {
                    return {
                        message: 'Exceeded maximum length of 15 characters',
                        severity: vscode.InputBoxValidationSeverity.Error
                    } as vscode.InputBoxValidationMessage;
                }

				return undefined;
			}
		});
    }

    private async enterTargetPort(component: devfile.Component): Promise<number | undefined> {
        const port = await vscode.window.showInputBox({
			value: '8080',
			title: 'Target Port',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!value) {
					return {
						message: 'Target port cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				const pValue: number = Number.parseInt(value);
				if (!Number.isInteger(pValue)) {
					return {
						message: 'Only Integer is allowed',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

                if (component.container && component.container.endpoints) {
                    if (component.container.endpoints.find(e => e.targetPort === pValue)) {
                        return {
                            message: 'Endpoint with this port already exists',
                            severity: vscode.InputBoxValidationSeverity.Error
                        } as vscode.InputBoxValidationMessage;
                    }
                }

				return undefined;
			}
		});

        return Number.parseInt(port);
    }

    private async enterExposure(): Promise<string | undefined> {
        return await vscode.window.showQuickPick([
			'public', 'internal', 'none'
		], {
			title: 'Endpoint Visibility (can be omitted)'
		});
    }

}
