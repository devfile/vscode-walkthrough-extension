/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as devfile from "../devfile";

const JOIN_STR = '\n';

export class DevfileSerializer {

    constructor(private devfile: devfile.Devfile) {
    }

    public toString(): string {
        const content: string[] = [
            this.getHeader(),
            this.getMetadata()
        ];
        
        const components = this.getComponents();
        if (components) {
            content.push(components);
        }

        const commands = this.getCommands();
        if (commands) {
            content.push(commands);
        }

        content.push('');
        return content.join(JOIN_STR);
    }

    public getHeader(): string {
        return 'schemaVersion: 2.2.0';
    }

    public getMetadata(): string {
        return [
            'metadata:',
            `  name: ${this.devfile?.metadata.name}`
        ].join(JOIN_STR);
    }

    public getComponents(): string {
        if (this.devfile.components.length === 0) {
            return '';
        }

        const arr: string[] = ['components:'];
        
        for (const c of this.devfile.components) {
            if (c.container) {
                arr.push(this.getContainerComponent(c));
            } else {
                arr.push(this.getVolumeComponent(c));
            }
        }

        return arr.join(JOIN_STR);
    }

    public getContainerComponent(c: devfile.Component): string {
        const arr: string[] = [
            `  - name: ${c.name}`,
            '    container:'
        ];

        if (c.container?.image) {
            arr.push(`      image: ${c.container?.image}`);
        }

        if (c.container?.memoryRequest) {
            arr.push(`      memoryRequest: '${c.container?.memoryRequest}'`);
        }

        if (c.container?.memoryLimit) {
            arr.push(`      memoryLimit: '${c.container?.memoryLimit}'`);
        }

        if (c.container?.cpuRequest) {
            arr.push(`      cpuRequest: '${c.container?.cpuRequest}'`);
        }

        if (c.container?.cpuLimit) {
            arr.push(`      cpuLimit: '${c.container?.cpuLimit}'`);
        }

        if (c.container?.mountSources) {
            arr.push(`      mountSources: ${c.container.mountSources}`);
        }

        if (c.container?.endpoints) {
            arr.push('      endpoints:');

            for (const endpoint of c.container.endpoints) {
                arr.push(
                    `        - exposure: ${endpoint.visibility}`,
                    `          name: ${endpoint.name}`,
                    `          protocol: ${endpoint.protocol}`,
                    `          targetPort: ${endpoint.port}`
                    );
            }
        }

        if (c.container?.env) {
            arr.push('      env:');
            for (const env of c.container.env) {
                arr.push(
                    `        - name: ${env.name}`,
                    `          value: ${env.value}`
                    );
            }
        }

        return arr.join(JOIN_STR);
    }

    public getVolumeComponent(c: devfile.Component): string {
        return '';
    }

    public getCommands(): string {
        if (this.devfile.commands.length === 0) {
            return '';
        }

        const arr: string[] = ['commands:'];
        
        for (const c of this.devfile.commands) {
            arr.push(
                `  - id: ${c.id}`,
                '    exec:',
                `      component: ${c.component}`,
                `      commandLine: ${c.commandLine}`,
                `      workingDir: ${c.workingDir}`
            );
        }

        return arr.join(JOIN_STR);
    }

}
