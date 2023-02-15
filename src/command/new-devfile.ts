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
import { inject, injectable } from 'inversify';
import { log } from '../logger';
import { DevfileService } from '../devfile/devfile-service';
import * as devfile from '../devfile';

@injectable()
export class NewDevfile {

	@inject(DevfileService)
    private service: DevfileService;

    async run(): Promise<void> {
		if (this.service.getDevfile()) {
			const answer = await vscode.window.showWarningMessage('You have already created Devfile.', 'Create New', 'Cancel');
			if ('Create New' !== answer) {
				return;
			}
		}

		const name = await vscode.window.showInputBox({
			value: 'devfile-sample',
			title: 'New Devfile Name'
		});

        log(`> devfile name [${name}]`);

		if (!name) {
			log('<< canceled');
			return;
		}

        this.service.newDevfile(name);
    }

}
