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
import { log } from "../logger";
import * as vscode from 'vscode';

const SEARCH = 'Show in Marketplace';

@injectable()
export class InstallYaml {

    async run(): Promise<boolean> {
        log('InstallYamlImpl::run()');

        const e = vscode.extensions.getExtension('redhat.vscode-yaml');
        if (e) {

            const answer = await vscode.window.showInformationMessage('YAML extension is already installed', SEARCH);
            if (SEARCH === answer) {
                await vscode.commands.executeCommand('workbench.extensions.search', 'redhat.vscode-yaml');
            }
            return true;
        } else {
            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', 'redhat.vscode-yaml');
                const answer = await vscode.window.showInformationMessage('YAML extension has been installed', SEARCH);
                if (SEARCH === answer) {
                    await vscode.commands.executeCommand('workbench.extensions.search', 'redhat.vscode-yaml');
                }

                // await new Promise(resolve => setTimeout(resolve, 1000));

                return true;
            } catch (err) {
                if (err.message) {
                    vscode.window.showWarningMessage(err.message);
                }
            }
        }

        return false;
    }

}
