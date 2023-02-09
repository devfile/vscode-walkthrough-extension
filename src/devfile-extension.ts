import * as vscode from 'vscode';
import { posix } from 'path';

let output: vscode.OutputChannel | undefined;

function log(msg: string) {
	output?.appendLine(msg);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {

	output = vscode.window.createOutputChannel('devfile-extension');
	output.show(true);
	// output.appendLine('> Initializing');
	// console.log('Congratulations, your extension "vscode-devfile" is now active!');

	new DevfileGenerator(context);

	// output.appendLine('> Extension Initialized');
	// output.appendLine('');
}


// This method is called when your extension is deactivated
export function deactivate() { }

const DEF_DEVFILE_NAME = 'devfile-sample';

const DEF_CONTAINER_COMPONENT_NAME = 'dev';
const DEF_CONTAINER_COMPONENT_IMAGE = 'quay.io/devfile/universal-developer-image:latest';
const DEF_CONTAINER_COMPONENT_MEMORY_LIMIT = '2048Mi';
const DEF_CONTAINER_COMPONENT_CPU_LIMIT = '0.5';

export interface ExposedPort {
	visibility: 'public' | 'private';
	name: string;
	protocol: string;
	port: number;
}

export interface EnvironmentVariable {
	name: string;
	value: string;
}

export class DevfileGenerator {

	private devfileName: string | undefined = DEF_DEVFILE_NAME;

	private containerComponentName: string | undefined = DEF_CONTAINER_COMPONENT_NAME;
	private containerComponentImage: string | undefined = DEF_CONTAINER_COMPONENT_IMAGE;
	private containerComponentMemoryLimit: string | undefined = DEF_CONTAINER_COMPONENT_MEMORY_LIMIT;
	private containerComponentCpuLimit: string | undefined = DEF_CONTAINER_COMPONENT_CPU_LIMIT;

	private containerExposedPorts: ExposedPort[] = [];
	private containerEnvironmentVariables: EnvironmentVariable[] = [];

	constructor(context: vscode.ExtensionContext) {
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-devfile', async () => this.nameTheDevfile()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-container-component', async () => this.newContainerComponent()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.new-command', async () => this.newCommand()));
		context.subscriptions.push(vscode.commands.registerCommand('vscode-devfile.generate-devfile', async () => this.generateDevfile()));
	}

	public async nameTheDevfile(): Promise<void> {
		await new Promise(resolve => setTimeout(resolve, 500));

		this.devfileName = await vscode.window.showInputBox({
			// prompt: 'Prompt',
			// placeHolder: 'placeHolder',
			value: DEF_DEVFILE_NAME,
			title: 'Devfile Name'
		});

		output?.appendLine(`.metadata.name: ${this.devfileName}`);

		if (!this.devfileName) {
			// output?.appendLine('<< returning');
			return;
		}

		try {
			await vscode.workspace.getConfiguration('vscode-devfile').update('new-devfile-name', `${this.devfileName}`);
		} catch (err) {
			output?.appendLine(`>> ERROR ${err}`);
		}
	}

	public async newContainerComponent(): Promise<void> {
		// cleanup
		this.containerExposedPorts = [];
		this.containerEnvironmentVariables = [];

		// component name
		this.containerComponentName = await vscode.window.showInputBox({
			value: DEF_CONTAINER_COMPONENT_NAME,
			title: 'Component Name'
		});

		if (!this.containerComponentName) {
			output?.appendLine('  << returning');
			return;
		}

		output?.appendLine(`.components[0].name: ${this.containerComponentName}`);

		// component container image
		this.containerComponentImage = await vscode.window.showInputBox({
			value: DEF_CONTAINER_COMPONENT_IMAGE,
			title: 'Component Image'
		});

		if (!this.containerComponentImage) {
			output?.appendLine('  << returning');
			return;
		}

		output?.appendLine(`.components[0].container.image: ${this.containerComponentImage}`);

		// memory limit, can be omitted
		this.containerComponentMemoryLimit = await vscode.window.showInputBox({
			value: DEF_CONTAINER_COMPONENT_MEMORY_LIMIT,
			title: 'Memory Limit'
		});

		output?.appendLine(`.components[0].container.memoryLimit: ${this.containerComponentMemoryLimit}`);

		// CPU limit, can be omitted
		this.containerComponentCpuLimit = await vscode.window.showInputBox({
			value: DEF_CONTAINER_COMPONENT_CPU_LIMIT,
			title: 'CPU Limit'
		});

		output?.appendLine(`.components[0].container.cpuLimit: ${this.containerComponentCpuLimit}`);

		// define endpoints
		while (await this.doExposePort()) {
			output?.appendLine('> expose port...');

			const port = await this.defineExposedPort();
			if (port) {
				this.containerExposedPorts.push(port);
			} else {
				output?.appendLine('<< got undefined.');
				break;
			}
		}

		output?.appendLine(`> Exposed ports: ${this.containerExposedPorts.length}`);
		for (const port of this.containerExposedPorts) {
			output?.appendLine(`    [ Visibility: ${port.visibility}; Name: ${port.name}; Protocol: ${port.protocol}; Port: ${port.port}; ]`);
		}

		// define environment variables
		while (await this.doDefineEnvironmentVariable()) {
			output?.appendLine('> define environment variable...');

			const variable = await this.defineEnvironmentVariable();
			if (variable) {
				this.containerEnvironmentVariables.push(variable);
			} else {
				output?.appendLine('<< got undefined.');
				break;
			}
		}

		output?.appendLine(`> Environment variables: ${this.containerEnvironmentVariables.length}`);
		for (const variable of this.containerEnvironmentVariables) {
			output?.appendLine(`    [ Name: ${variable.name}; Value: ${variable.value}; ]`);
		}

	}

	private async doExposePort(): Promise<boolean> {
		const exposePort = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to expose ${this.containerExposedPorts.length === 0 ? '' : 'one more '}port?`,
		});

		return 'Yes' === exposePort;
	}

	private async doDefineEnvironmentVariable(): Promise<boolean> {
		const defineVariable = await vscode.window.showQuickPick([
			'Yes', 'No'
		], {
			title: `Would you like to define ${this.containerEnvironmentVariables.length === 0 ? '' : 'one more '}environment variable for the container?`,
		});

		return 'Yes' === defineVariable;
	}

	private async defineExposedPort(): Promise<ExposedPort | undefined> {
		const visibility = await vscode.window.showQuickPick([
			'public', 'private'
		], {
			 title: 'Port Visibility'
		});

		output?.appendLine(`Visibility: ${visibility}`);

		if (!visibility) {
			return undefined;
		}

		const name = await vscode.window.showInputBox({
			value: 'http-demo',
			title: 'Port Name'
		});

		if (!name) {
			return undefined;
		}

		const port = await vscode.window.showInputBox({
			value: '8080',
			title: 'Target Port'
		});

		if (!port) {
			return undefined;
		}

		const portValue: number = Number.parseInt(port);

		output?.appendLine(`Port value: ${portValue}`);
		output?.appendLine(`Number.isInteger(portValue): ${Number.isInteger(portValue)}`);

		const protocol = await vscode.window.showInputBox({
			value: 'http',
			title: 'Protocol'
		});

		if (!protocol) {
			return undefined;
		}

		return {
			visibility: visibility === 'public' ? 'public' : 'private',
			name: name,
			port: portValue,
			protocol: protocol
		};
	}

	private async defineEnvironmentVariable(): Promise<EnvironmentVariable | undefined> {
		const name = await vscode.window.showInputBox({
			value: this.containerEnvironmentVariables.length === 0 ? 'WELCOME' : '',
			title: 'Environment Variable Name',
			validateInput: (value): string | vscode.InputBoxValidationMessage | undefined | null |
			Thenable<string | vscode.InputBoxValidationMessage | undefined | null> => {
				for (const v of this.containerEnvironmentVariables) {
					if (v.name === value) {
						return {
							message: 'Enviroment variable with this name already exists',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					} else if (!value) {
						return {
							message: 'Environment variable name cannot be empty',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					}
				}

				return undefined;
			}
		});

		if (!name) {
			return undefined;
		}

		const value = await vscode.window.showInputBox({
			value: this.containerEnvironmentVariables.length === 0 ? 'Hello World' : '',
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
		}
	}

	public async newCommand(): Promise<void> {
		vscode.window.showInformationMessage('New Command');
	}

	public async generateDevfile(): Promise<void> {
		if (await this.writeDevfile(this.getDevfileContent())) {
			await this.openDevfile();
		}
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
				output?.appendLine(`>> ERROR ${err}`);
			}
		}

		output?.appendLine('');
		output?.appendLine(`> devfile exist ${devfileExist}`);

		if (devfileExist) {
			const result = await vscode.window.showWarningMessage('Devfile already exists', 'Skip', 'Override');
			output?.appendLine(`> result ${result}`);

			if ('Override' === result) {
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

	public getDevfileContent(): string {
		let content = `schemaVersion: 2.2.0
metadata:
  name: ${this.devfileName}
`;

		return content;
	}

}
