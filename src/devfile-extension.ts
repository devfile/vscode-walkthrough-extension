import * as vscode from 'vscode';
import { posix } from 'path';
import { Command, ComponentContainer, Devfile, Endpoint, EnvironmentVariable } from './devfile-api';
import { DevfileWriter } from './devfile-writer';
import { log } from './logger';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	new DevfileExtension(context);
}


// This method is called when your extension is deactivated
export function deactivate() { }

export class DevfileExtension {

	private devfile: Devfile | undefined;

	constructor(context: vscode.ExtensionContext) {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-devfile', async () => this.newDevfile()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-component', async () => this.newComponent()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-command', async () => this.newCommand()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.save-devfile', async () => this.saveDevfile()));
	}

	public async newDevfile(): Promise<void> {
		if (this.devfile) {
			const answer = await vscode.window.showWarningMessage('You have already created Devfile.', 'Create New', 'Cancel');
			if ('Create New' !== answer) {
				return;
			}
		}

		const name = await vscode.window.showInputBox({
			value: 'devfile-sample',
			title: 'New Devfile Name'
		});

		if (!name) {
			log('<< canceled');
			return;
		}

		this.devfile = {
			metadata: {
				name
			},
			components: [],
			commands: []
		} as Devfile;

		log(new DevfileWriter(this.devfile).getMetadata());
	}

	public async newComponent(): Promise<void> {
		if (await this.warnIfDevfileIsNotCreated()) {
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

		const container: ComponentContainer = {
			image: containerImage,
			mountSources: true
		};

		// add new component
		this.devfile?.components.push({
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

		// define endpoints
		while (await this.wantToDefineEndpoint(container.endpoints)) {
			log('> expose port...');

			const endpoint = await this.defineEndpoint(container.endpoints);
			if (endpoint) {
				if (!container.endpoints) {
					container.endpoints = [];
				}
	
				container.endpoints.push(endpoint);
			} else {
				log('<< canceled');
				break;
			}
		}

		if (container.endpoints) {
			log(`> Endpoints: ${container.endpoints.length}`);
			for (const port of container.endpoints) {
				log(`    [ Visibility: ${port.visibility}; Name: ${port.name}; Protocol: ${port.protocol}; Port: ${port.port}; ]`);
			}
		}

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
			value: this.devfile?.components.length === 0 ? 'dev' : '',
			title: 'Component Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.devfile) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				for (const c of this.devfile.components) {
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
			value: this.devfile?.components.length === 0 ? 'quay.io/devfile/universal-developer-image:latest' : '',
			title: 'Component Image',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.devfile) {
					return {
						message: 'Devfile is not created',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				for (const c of this.devfile.components) {
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
			value: this.devfile?.components.length === 1 ? '2048Mi' : '512Mi',
			title: 'Memory Limit',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
				Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!this.devfile) {
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
				if (!this.devfile) {
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

	private async wantToDefineEndpoint(endpoints: Endpoint[] | undefined): Promise<boolean> {
		const exposePort = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to define${endpoints && endpoints.length !== 0 ? ' one more ' : ' '}endpoint for the container?`,
		});

		return 'Yes' === exposePort;
	}

	private async wantToDefineEnvironmentVariable(env: EnvironmentVariable[] | undefined): Promise<boolean> {
		const defineVariable = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to define${env && env.length !== 0 ? ' one more ' : ' '}environment variable for the container?`,
		});

		return 'Yes' === defineVariable;
	}

	private async defineEndpoint(endpoints: Endpoint[] | undefined): Promise<Endpoint | undefined> {
		const exposedPorts = endpoints;

		const visibility = await vscode.window.showQuickPick([
			'public', 'internal'
		], {
			title: 'Endpoint Visibility'
		});

		log(`Visibility: ${visibility}`);

		if (!visibility) {
			return undefined;
		}

		const name = await vscode.window.showInputBox({
			value: exposedPorts && exposedPorts.length !== 0 ? '' : 'http-demo',
			title: 'Endpoint Name',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!value) {
					return {
						message: 'Endpoint name cannot be empty',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}
			
				if (exposedPorts) {
					for (const p of exposedPorts) {
						if (p.name === value) {
							return {
								message: 'Endpoint with this name already exists',
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

		const port = await vscode.window.showInputBox({
			value: exposedPorts && exposedPorts.length !== 0 ? '' : '8080',
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

				if (exposedPorts) {
					for (const p of exposedPorts) {
						if (p.port === pValue) {
							return {
								message: 'Endpoint with this port already exists',
								severity: vscode.InputBoxValidationSeverity.Error
							} as vscode.InputBoxValidationMessage;
						}
					}
				}

				return undefined;
			}
		});

		if (!port) {
			return undefined;
		}

		const portValue: number = Number.parseInt(port);

		log(`Port value: ${portValue}`);
		log(`Number.isInteger(portValue): ${Number.isInteger(portValue)}`);

		const protocol = await vscode.window.showInputBox({
			value: 'http',
			title: 'Protocol',

			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				if (!value) {
					return {
						message: 'Empty value is not allowed',
						severity: vscode.InputBoxValidationSeverity.Error
					} as vscode.InputBoxValidationMessage;
				}

				return undefined;
			}

		});

		if (!protocol) {
			return undefined;
		}

		return {
			visibility: visibility === 'public' ? 'public' : 'internal',
			name: name,
			port: portValue,
			protocol: protocol
		};
	}

	private async defineEnvironmentVariable(env: EnvironmentVariable[] | undefined): Promise<EnvironmentVariable | undefined> {
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

	public async newCommand(): Promise<void> {
		// the Devfile object should be already created
		if (await this.warnIfDevfileIsNotCreated()) {
			return;
		}

		// user has alreadt created at least one container component
		let containerComponents = 0;
		for (const c of this.devfile!.components) {
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
				this.devfile?.commands.push(command);
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
		log(`>>> commands: ${this.devfile?.commands.length}`);
		if (this.devfile?.commands.length === 0) {
			return true;
		}

		const answer = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: 'Would you like to add one more command?',
		});

		return 'Yes' === answer;
	}

	private async defineCommand(): Promise<Command | undefined> {
		const commands = this.devfile!.commands;

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
		for (const c of this.devfile!.components) {
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

	public async saveDevfile(): Promise<void> {
		if (await this.warnIfDevfileIsNotCreated()) {
			return;
		}

		const content = new DevfileWriter(this.devfile!).toString();
		if (await this.writeDevfile(content)) {
			await this.openDevfile();
		}
	}

	private async warnIfDevfileIsNotCreated(): Promise<boolean> {
		if (!this.devfile) {
			await vscode.window.showErrorMessage('The first you need to create a Devfile');
			return true;
		}

		return false;
	}

	private async writeDevfile(content: string): Promise<boolean> {
		if (!vscode.workspace.workspaceFolders ||
			vscode.workspace.workspaceFolders.length == 0) {
			await vscode.window.showInformationMessage('The first you need to open a project');
			return false;
		}

		const folderUri = vscode.workspace.workspaceFolders[0].uri;
		const devfileUri = folderUri.with({ path: posix.join(folderUri.path, 'devfile.yaml') });

		let devfileExist = true;
		try {
			await vscode.workspace.fs.stat(devfileUri);
		} catch (err) {
			if (err instanceof vscode.FileSystemError) {
				devfileExist = false;
			} else {
				log(`>> ERROR ${err}`);
			}
		}

		log('');
		log(`> devfile exist ${devfileExist}`);

		if (devfileExist) {
			const answer = await vscode.window.showWarningMessage('Devfile already exists', 'Override', 'Skip');
			log(`> answer ${answer}`);

			if ('Override' === answer) {
				await vscode.workspace.fs.writeFile(devfileUri, Buffer.from(content, 'utf8'));
			} else {
				return false;
			}

		} else {
			await vscode.workspace.fs.writeFile(devfileUri, Buffer.from(content, 'utf8'));
		}

		return true;
	}

	private async openDevfile(): Promise<void> {
		if (!vscode.workspace.workspaceFolders ||
			vscode.workspace.workspaceFolders.length == 0) {
			await vscode.window.showInformationMessage('The first you need to open a project');
			return;
		}

		const folderUri = vscode.workspace.workspaceFolders[0].uri;
		const devfileUri = folderUri.with({ path: posix.join(folderUri.path, 'devfile.yaml') });
		vscode.window.showTextDocument(devfileUri);
	}

}
