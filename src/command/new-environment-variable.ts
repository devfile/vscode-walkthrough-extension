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
export class NewEnvironmentVariable {

	@inject(DevfileService)
    private service: DevfileService;

    async run(): Promise<void> {
        vscode.window.showInformationMessage('NEW CONTAINER ENVIRONMENT VARIABLE !!!');

    }

}
