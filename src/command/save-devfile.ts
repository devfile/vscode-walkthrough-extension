/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as vscode from 'vscode';
import { inject, injectable } from "inversify";
import { DevfileService } from "../devfile/devfile-service";
import { DevfileSerializer } from '../devfile/devfile-serializer';
import { log } from '../logger';
import { posix } from 'path';

@injectable()
export class SaveDevfile {

	@inject(DevfileService)
	private service: DevfileService;

    async run(): Promise<void> {
		if (!this.service.getDevfile()) {
			await vscode.window.showErrorMessage('The first you need to create a Devfile');
			return;
		}

		const content = new DevfileSerializer(this.service.getDevfile()!).toString();

		if (await this.writeDevfile(content)) {
			await this.openDevfile();
		}
    }

	private async writeDevfile(content: string): Promise<boolean> {
		if (!vscode.workspace.workspaceFolders ||
			vscode.workspace.workspaceFolders.length === 0) {
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
			vscode.workspace.workspaceFolders.length === 0) {
			await vscode.window.showInformationMessage('The first you need to open a project');
			return;
		}

		const folderUri = vscode.workspace.workspaceFolders[0].uri;
		const devfileUri = folderUri.with({ path: posix.join(folderUri.path, 'devfile.yaml') });
		vscode.window.showTextDocument(devfileUri);
	}

}
