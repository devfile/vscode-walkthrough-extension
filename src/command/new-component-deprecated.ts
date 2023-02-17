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
export class NewComponent {

	@inject(DevfileService)
    private service: DevfileService;

    async run(): Promise<void> {
		if (2+3 === 5) {
			vscode.window.showInformationMessage('RETURNING from NewComponent');
			return;
		}

		if (!this.service.getDevfile()) {
			await vscode.window.showErrorMessage('The first you need to create a Devfile');
			return;
		}

		// component name
		const componentName = await this.defineComponentName();
		if (!componentName) {
			log('<< canceled');
			return;
		}

		log(`> component name: ${componentName}`);

		// container component image
		const containerImage = await this.defineComponentImage();
		if (!containerImage) {
			log('<< canceled');
			return;
		}

		log(`> container image: ${containerImage}`);

		const container: devfile.ComponentContainer = {
			image: containerImage,
			mountSources: true
		};

		// add new component
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

		// // define endpoints
		// while (await this.wantToDefineEndpoint(container.endpoints)) {
		// 	log('> expose port...');

		// 	const endpoint = await this.defineEndpoint(container.endpoints);
		// 	if (endpoint) {
		// 		if (!container.endpoints) {
		// 			container.endpoints = [];
		// 		}
	
		// 		container.endpoints.push(endpoint);
		// 	} else {
		// 		log('<< canceled');
		// 		break;
		// 	}
		// }

		// if (container.endpoints) {
		// 	log(`> Endpoints: ${container.endpoints.length}`);
		// 	for (const port of container.endpoints) {
		// 		log(`    [ Visibility: ${port.visibility}; Name: ${port.name}; Protocol: ${port.protocol}; Port: ${port.port}; ]`);
		// 	}
		// }

		// define environment variables
		while (await this.wantToDefineEnvironmentVariable(container.env)) {
			log('> define environment variable...');

			const variable = await this.defineEnvironmentVariable(container.env);
			if (variable) {
				if (!container.env) {
					container.env = [];
				}
				container.env.push(variable);
			} else {
				log('<< canceled');
				break;
			}
		}

		if (container.env) {
			log(`> Environment variables: ${container.env.length}`);
			for (const variable of container.env) {
				log(`    [ Name: ${variable.name}; Value: ${variable.value}; ]`);
			}
		}
    }

	private async defineComponentName(): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: this.service.getDevfile().components.length === 0 ? 'dev' : '',
			title: 'Component Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.service.getDevfile()) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				for (const c of this.service.getDevfile().components) {
					if (c.name === value) {
						return {
							message: 'Component with this name already exists',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					} else if (!value) {
						return {
							message: 'Component name cannot be empty',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					}
				}
			}
		});
	}

	private async defineComponentImage(): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: this.service.getDevfile().components.length === 0 ? 'quay.io/devfile/universal-developer-image:latest' : '',
			title: 'Component Image',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.service.getDevfile()) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				for (const c of this.service.getDevfile().components) {
					if (c.container && c.container.image === value) {
						return {
							message: 'Component with this image already exists',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					} else if (!value) {
						return {
							message: 'Component name cannot be empty',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					}
				}
			}
		});
	}

	private async defineComponentMemoryLimit(): Promise<string | undefined> {
		return await vscode.window.showInputBox({
			value: this.service.getDevfile().components.length === 1 ? '2048Mi' : '512Mi',
			title: 'Memory Limit',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.service.getDevfile()) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

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
		return await vscode.window.showInputBox({
			value: '0.5',
			title: 'CPU Limit',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.service.getDevfile()) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				if (!value) {
					return {
						message: 'CPU limit cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
			}
		});
	}

	private async wantToDefineEndpoint(endpoints: devfile.Endpoint[] | undefined): Promise<boolean> {
		const exposePort = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to define${endpoints && endpoints.length !== 0 ? ' one more ' : ' '}endpoint for the container?`,
		});

		return 'Yes' === exposePort;
	}

	// private async defineEndpoint(endpoints: devfile.Endpoint[] | undefined): Promise<devfile.Endpoint | undefined> {
	// 	const exposedPorts = endpoints;

	// 	const visibility = await vscode.window.showQuickPick([
	// 		'public', 'internal'
	// 	], {
	// 		title: 'Endpoint Visibility'
	// 	});

	// 	log(`Visibility: ${visibility}`);

	// 	if (!visibility) {
	// 		return undefined;
	// 	}

	// 	const name = await vscode.window.showInputBox({
	// 		value: exposedPorts && exposedPorts.length !== 0 ? '' : 'http-demo',
	// 		title: 'Endpoint Name',

	// 		validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
	// 		Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
	// 			if (!value) {
	// 				return {
	// 					message: 'Endpoint name cannot be empty',
	// 					severity: vscode.InputBoxValidationSeverity.Error
	// 				} as vscode.InputBoxValidationMessage;
	// 			}
			
	// 			if (exposedPorts) {
	// 				for (const p of exposedPorts) {
	// 					if (p.name === value) {
	// 						return {
	// 							message: 'Endpoint with this name already exists',
	// 							severity: vscode.InputBoxValidationSeverity.Error
	// 						} as vscode.InputBoxValidationMessage;
	// 					}
	// 				}
	// 			}

	// 			return undefined;
	// 		}
	// 	});

	// 	if (!name) {
	// 		return undefined;
	// 	}

	// 	const port = await vscode.window.showInputBox({
	// 		value: exposedPorts && exposedPorts.length !== 0 ? '' : '8080',
	// 		title: 'Target Port',

	// 		validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
	// 		Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
	// 			if (!value) {
	// 				return {
	// 					message: 'Target port cannot be empty',
	// 					severity: vscode.InputBoxValidationSeverity.Error
	// 				} as vscode.InputBoxValidationMessage;
	// 			}

	// 			const pValue: number = Number.parseInt(value);
	// 			if (!Number.isInteger(pValue)) {
	// 				return {
	// 					message: 'Only Integer is allowed',
	// 					severity: vscode.InputBoxValidationSeverity.Error
	// 				} as vscode.InputBoxValidationMessage;
	// 			}

	// 			if (exposedPorts) {
	// 				for (const p of exposedPorts) {
	// 					if (p.port === pValue) {
	// 						return {
	// 							message: 'Endpoint with this port already exists',
	// 							severity: vscode.InputBoxValidationSeverity.Error
	// 						} as vscode.InputBoxValidationMessage;
	// 					}
	// 				}
	// 			}

	// 			return undefined;
	// 		}
	// 	});

	// 	if (!port) {
	// 		return undefined;
	// 	}

	// 	const portValue: number = Number.parseInt(port);

	// 	log(`Port value: ${portValue}`);
	// 	log(`Number.isInteger(portValue): ${Number.isInteger(portValue)}`);

	// 	const protocol = await vscode.window.showInputBox({
	// 		value: 'http',
	// 		title: 'Protocol',

	// 		validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
	// 		Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
	// 			if (!value) {
	// 				return {
	// 					message: 'Empty value is not allowed',
	// 					severity: vscode.InputBoxValidationSeverity.Error
	// 				} as vscode.InputBoxValidationMessage;
	// 			}

	// 			return undefined;
	// 		}

	// 	});

	// 	if (!protocol) {
	// 		return undefined;
	// 	}

	// 	return {
	// 		visibility: visibility === 'public' ? 'public' : 'internal',
	// 		name: name,
	// 		port: portValue,
	// 		protocol: protocol
	// 	};
	// }

	private async wantToDefineEnvironmentVariable(env: devfile.EnvironmentVariable[] | undefined): Promise<boolean> {
		const defineVariable = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to define${env && env.length !== 0 ? ' one more ' : ' '}environment variable for the container?`,
		});

		return 'Yes' === defineVariable;
	}


	private async defineEnvironmentVariable(env: devfile.EnvironmentVariable[] | undefined): Promise<devfile.EnvironmentVariable | undefined> {
		const environment = env;
		const name = await vscode.window.showInputBox({
			value: env && env.length !== 0 ? '' : 'WELCOME',
			title: 'Environment Variable Name',
			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {

				if (!value) {
					return {
						message: 'Environment variable name cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
				
				if (environment) {
					for (const v of environment) {
						if (v.name === value) {
							return {
								message: 'Enviroment variable with this name already exists',
								severity: vscode.InputBoxValidationSeverity.Error
							} as vscode.InputBoxValidationMessage;
						}
					}
				}

				return undefined;
			}
		});

		if (!name) {
			return undefined;
		}

		const value = await vscode.window.showInputBox({
			value: env && env.length !== 0 ? '' : 'Hello World',
			title: 'Environment Variable Value'
		});

		if (value === undefined) {
			log('<< value is UNDEFINED');
			return undefined;
		}

		log(`>> value: '${value}'`);

		return {
			name,
			value
		};
	}

}
