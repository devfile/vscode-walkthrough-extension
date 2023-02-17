/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { injectable } from "inversify";
import * as devfile from '../devfile';
import { log } from "../logger";
import * as vscode from 'vscode';
import { posix } from 'path';
import { env } from "process";

import { safeDump, safeLoad } from 'js-yaml';

export enum DevfileCheckStatus {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Unknown = 0,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    NotExist = 1,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Exist = 2,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    NotAFile = 3
}

export const DEFAULT_SCHEMA_VERSION = '2.2.0';

@injectable()
export class DevfileService {

    private devfileCheckStatus: DevfileCheckStatus = DevfileCheckStatus.Unknown;

    private devfile: devfile.Devfile = {
        schemaVersion: DEFAULT_SCHEMA_VERSION
    };

    private updateStrategy: devfile.DevfileUpdateStrategy = devfile.DevfileUpdateStrategy.Forbidden;

    public async init(): Promise<void> {
        // do nothing if workpsace is not opened
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('DevfileService :: Workspace is not opened');
            return;
        }

        // check the Devfile
        this.devfileCheckStatus = await this.checkDevfileOnFileSystem();
        switch (this.devfileCheckStatus) {
            case DevfileCheckStatus.Unknown:
                log(`>> Devfile Check Status: Unknown`);
                break;
            case DevfileCheckStatus.Exist:
                log(`>> Devfile Check Status: Exist`);
                break;
            case DevfileCheckStatus.NotExist:
                log(`>> Devfile Check Status: NotExist`);
                break;
            case DevfileCheckStatus.NotAFile:
                log(`>> Devfile Check Status: NotAFile`);
                break;
        }

        if (DevfileCheckStatus.Unknown === this.devfileCheckStatus) {
            vscode.window.showErrorMessage('DevfileService :: Failure to check for devfile.yaml existence');
            return;
        }

        if (DevfileCheckStatus.NotAFile === this.devfileCheckStatus) {
            vscode.window.showErrorMessage('DevfileService :: Resource devfile.yaml already exists and it is not a file');
            return;
        }

        if (DevfileCheckStatus.Exist === this.devfileCheckStatus) {
            try {
                await this.readFromFileSystem();
                if (this.isDevfileValid()) {
                    this.updateStrategy = devfile.DevfileUpdateStrategy.Silent;
                } else {
                    this.updateStrategy = devfile.DevfileUpdateStrategy.Forbidden;
                    vscode.window.showErrorMessage('Devfile at the root of your project has invalid format');
                    this.showStatusBarItem();
                }

            } catch (err) {
                log(`!!!! Error occured. ${err.message}`);

            }
        }

        if (DevfileCheckStatus.NotExist === this.devfileCheckStatus) {
            this.updateStrategy = devfile.DevfileUpdateStrategy.Silent;
        }

        await this.ensureNameIsSet();

        // listen for devfile.yaml change
        vscode.workspace.onDidDeleteFiles(e => {
            log(`>> deleted files ${e.files}`);
        });
    }

    /**
     * The code of this method needs to be decoupled in a separate module
     */
    private showStatusBarItem(): void {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = '$(extensions-warning-message) Wrond Devfile Format';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.tooltip = 'Devfile at the root of your project has invalid format';
        statusBarItem.command = 'vscode-devfile.save-devfile';
        statusBarItem.show();
    }

    public getDevfile(): devfile.Devfile | undefined {
        return this.devfile;
    }

    public getDevfileCheckStatus(): DevfileCheckStatus {
        return this.devfileCheckStatus;
    }

    public getUpdateStrategy(): devfile.DevfileUpdateStrategy {
        return this.updateStrategy;
    }

    public newDevfile(name: string): void {
		this.devfile = {
			metadata: {
				name
			},
			components: [],
			commands: []
		} as devfile.Devfile;
    }

    public getDevfileURI(): vscode.Uri | undefined {
		if (!vscode.workspace.workspaceFolders ||
			vscode.workspace.workspaceFolders.length === 0) {
			return undefined;
		}

		const folderUri = vscode.workspace.workspaceFolders[0].uri;
		const devfileUri = folderUri.with({ path: posix.join(folderUri.path, 'devfile.yaml') });

        return devfileUri;
    }

    public async checkDevfileOnFileSystem(): Promise<DevfileCheckStatus> {
        const devfileUri = this.getDevfileURI();
        if (!devfileUri) {
            return DevfileCheckStatus.Unknown;
        }

        try {
            const stat = await vscode.workspace.fs.stat(devfileUri);
            if (stat.type === vscode.FileType.File) {
                return DevfileCheckStatus.Exist;
            }

            return DevfileCheckStatus.NotAFile;
        } catch (err) {
            if (err instanceof vscode.FileSystemError && 'FileNotFound' === err.code) {
                return DevfileCheckStatus.NotExist;
			}

            log(`>> ERROR ${err}`);
        }

        return DevfileCheckStatus.Unknown;
    }

    private ensureNameIsSet(): void {
        if (!this.devfile.metadata) {
            this.devfile.metadata = {};

        } else if (this.devfile.metadata.name) {
            // log('> .metaata.name is already SET');
            return;
        }

        // DevWorkspace specific
        if (env.DEVWORKSPACE_NAME) {
            this.devfile.metadata.name = env.DEVWORKSPACE_NAME;
            log(`> .metadata.name was set to [${this.devfile.metadata.name}]`);
            return;
        }

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length) {
            this.devfile.metadata.name = vscode.workspace.workspaceFolders[0].name;
            log(`> .metadata.name was set to [${this.devfile.metadata.name}]`);
            return;

        }

        // log('<< Unable to initialize Devfile default name. Use default \'devfile-sample\'');
        this.devfile.metadata.name = 'devfile-sample';
        log(`> .metadata.name was set to [${this.devfile.metadata.name}]`);
    }

    private async readFromFileSystem(): Promise<void> {
        const devfileUri = this.getDevfileURI();
        const readData = await vscode.workspace.fs.readFile(devfileUri);
        const readStr = Buffer.from(readData).toString('utf8');
        this.devfile = safeLoad(readStr) as devfile.Devfile;
    }

    public async saveToFileSystem(): Promise<void> {
        const content = safeDump(this.devfile);
        const devfileUri = this.getDevfileURI();
        await vscode.workspace.fs.writeFile(devfileUri!, Buffer.from(content, 'utf8'));
    }

    private isDevfileValid(): boolean {
        if (!this.devfile.schemaVersion) {
            log('<< Devfile :: schemaVersion is not set');
            return false;
        }

		if (this.devfile.metadata ||
            this.devfile.components ||
            this.devfile.commands) {
                return true;
		}

        log('<< Devfile :: wrong format');
        return false;
	}

}
