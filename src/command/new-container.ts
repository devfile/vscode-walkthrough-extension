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
import { NewContainer, SaveDevfile } from "../model/extension-model";
import { countContainerComponents } from "./util";

@injectable()
export class NewContainerImpl implements NewContainer {

	@inject(DevfileService)
    private service: DevfileService;

    @inject(SaveDevfile)
    private savedevfile: SaveDevfile;

    async run(): Promise<boolean> {
        // this.service.readFromFileSystem();
        log('NewContainerImpl::run()');

        try {
            // component name
            const componentName = await this.defineComponentName();
            if (!componentName) {
                log('<< canceled');
                return false;
            }

            log(`> component name: ${componentName}`);

            // container component image
            const containerImage = await this.defineComponentImage();
            if (!containerImage) {
                log('<< canceled');
                return false;
            }

            log(`> container image: ${containerImage}`);

            const container: devfile.ComponentContainer = {
                image: containerImage,
                mountSources: true
            };

            // add new component
            if (!this.service.getDevfile().components) {
                log('<<< added .components field');
                this.service.getDevfile().components = [];
            }

            this.service.getDevfile().components.push({
                name: componentName,
                container
            });

            // memory limit, can be omitted
            const memoryLimit = await this.defineComponentMemoryLimit();
            if (memoryLimit) {
                log(`> memory limit: ${memoryLimit}`);
                container.memoryLimit = memoryLimit;
            } else {
                log('<< canceled');
            }

            // CPU limit, can be omitted
            const cpuLimit = await this.defineComponentCpuLimit();
            if (cpuLimit) {
                log(`> cpu limit: ${cpuLimit}`);
                container.cpuLimit = cpuLimit;
            } else {
                log('<< canceled');
            }

            this.savedevfile.onDidDevfileUpdate().then(value => {
                log(`>>>> Devfile Updated: ${value}`);
            });

			vscode.window.showInformationMessage(`Container '${componentName}' has been created successfully`, 'Open Devfile').then(value => {
                log('>>>> USER ANSWERED ' + value);
            });
            return true;
        } catch (err) {
            log(`ERROR occured: ${err.message}`);
        }

        return false;
    }

	private async defineComponentName(): Promise<string | undefined> {
        log('NewContainerImpl::defineComponentName()');

        const containerComponents = countContainerComponents(this.service.getDevfile());

		return await vscode.window.showInputBox({
			value: containerComponents === 0 ? 'dev' : '',
			title: 'Container Component Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

                if (!value) {
                    return {
                        message: 'Container component name cannot be empty',
                        severity: vscode.InputBoxValidationSeverity.Error
                    } as vscode.InputBoxValidationMessage;
                }

                if (this.service.getDevfile().components) {
                    for (const c of this.service.getDevfile().components) {
                        if (c.name === value) {
                            return {
                                message: 'Component with this name already exists',
                                severity: vscode.InputBoxValidationSeverity.Error
                            } as vscode.InputBoxValidationMessage;
                        }
                    }
                }

			}
		});
	}

	private async defineComponentImage(): Promise<string | undefined> {
        log('NewContainerImpl::defineComponentImage()');

        const containerComponents = countContainerComponents(this.service.getDevfile());

		return await vscode.window.showInputBox({
			value: containerComponents === 0 ? 'quay.io/devfile/universal-developer-image:latest' : '',
			title: 'Container Image',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

                if (!value) {
                    return {
                        message: 'Container image cannot be empty',
                        severity: vscode.InputBoxValidationSeverity.Error
                    } as vscode.InputBoxValidationMessage;
                }

                if (this.service.getDevfile().components) {
                    for (const c of this.service.getDevfile().components) {
                        if (c.container && c.container.image === value) {
                            return {
                                message: 'Container with this image already exists',
                                severity: vscode.InputBoxValidationSeverity.Error
                            } as vscode.InputBoxValidationMessage;
                        }
                    }
                }

			}
		});
	}

	private async defineComponentMemoryLimit(): Promise<string | undefined> {
        log('NewContainerImpl::defineComponentMemoryLimit()');

        const containerComponents = countContainerComponents(this.service.getDevfile());

		return await vscode.window.showInputBox({
			value: containerComponents > 1 ? '512Mi' : '2048Mi',
			title: 'Memory Limit',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				
				if (!value) {
					return {
						message: 'Memory limit cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
			}
		});
	}

	private async defineComponentCpuLimit(): Promise<string | undefined> {
        log('NewContainerImpl::defineComponentCpuLimit()');

		return await vscode.window.showInputBox({
			value: '0.5',
			title: 'CPU Limit',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'CPU limit cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
			}
		});
	}

	async ensureAtLeastOneContainerExist(): Promise<boolean> {
        // const NEED_TO_ADD_CONTAINER = 'The first you need to add at least one container';
        // const NEW_CONTAINER = 'New Container';

		// // check for .devfile.components existence
		// if (!this.service.getDevfile().components) {
		// 	const answer = await vscode.window.showWarningMessage(NEED_TO_ADD_CONTAINER, NEW_CONTAINER);
		// 	if (NEW_CONTAINER !== answer) {
		// 		log('< user do not want to add a container');
		// 		return false;
		// 	}

		// 	log('> ask for create a container');
		// 	if (!await this.run()) {
		// 		log('< creating of container was cancelled');
		// 		return false;
		// 	}
		// }

		// there should be at least one container component created
		// let containerComponents = this.countContainerComponents();
		if (countContainerComponents(this.service.getDevfile()) === 0) {
			const answer = await vscode.window.showWarningMessage('The first you need to add at least one container', 'New Container');

            if ('New Container' !== answer) {
				log('< user do not want to add a container 2');
				return false;
            }

            if (!await this.run()) {
                log('< creating of container was cancelled 2');
                return false;
            }
            // we suppose here the user has created a container
		}

		///////////////////////////////////////
		return true;
		///////////////////////////////////////
	}


}
