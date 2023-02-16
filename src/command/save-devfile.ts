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
import { log } from '../logger';
import * as devfile from "../devfile";
import { SaveDevfile } from '../model/extension-model';

@injectable()
export class SaveDevfileImpl implements SaveDevfile {

	@inject(DevfileService)
	private service: DevfileService;

    async run(): Promise<boolean> {
		switch (this.service.getUpdateStrategy()) {
			case devfile.DevfileUpdateStrategy.Forbidden:
				await vscode.window.showErrorMessage('Unable to save the Devfile');
				return false;

			case devfile.DevfileUpdateStrategy.Silent:
				return await this.silentUpdate();
			
			case devfile.DevfileUpdateStrategy.ConfirmUpdate:
				return await this.confirmUpdate();

			case devfile.DevfileUpdateStrategy.ConfirmRewrite:
				return await this.confirmOverwrite();
		}
    }

	async onDidDevfileUpdate(): Promise<boolean> {
		if (this.service.getUpdateStrategy() === devfile.DevfileUpdateStrategy.Silent) {
			try {
				await this.service.saveToFileSystem();
				return true;
			} catch (err) {
				log(`ERROR occured: ${err.message}`);
			}
		}
		return false;
	}

	private async silentUpdate(): Promise<boolean> {
		try {
			await this.service.saveToFileSystem();
			await this.performPostSaveActions();
			return true;
		
		} catch (err) {
            log(`ERROR occured: ${err.message}`);
		}

		return false;
	}

	private async confirmUpdate(): Promise<boolean> {
		try {
			const answer = await vscode.window.showWarningMessage('Devfile already exists', 'Update', 'Cancel');
			log(`> answer ${answer}`);

			if ('Update' === answer) {
				await this.service.saveToFileSystem();
				await this.performPostSaveActions();
				return true;
			}

		} catch (err) {
			log(`ERROR occured: ${err.message}`);
		}

		return false;
	}

	private async confirmOverwrite(): Promise<boolean> {
		try {
			const answer = await vscode.window.showWarningMessage('Devfile already exists', 'Overwrite', 'Cancel');
			log(`> answer ${answer}`);

			if ('Overwrite' === answer) {
				await this.service.saveToFileSystem();
				await this.performPostSaveActions();
				return true;
			}

		} catch (err) {
			log(`ERROR occured: ${err.message}`);
		}

		return false;
	}

	private async performPostSaveActions(): Promise<void> {
		const devfileUri = this.service.getDevfileURI();
		vscode.window.showTextDocument(devfileUri);
	}

}
