import { Component, Devfile } from "./devfile-api";

const JOIN_STR = '\n';

export class DevfileWriter {

    constructor(private devfile: Devfile) {
    }

    public toString(): string {
        return [
            this.getHeader(),
            this.getMetadata(),
            this.getComponents()
        ].join(JOIN_STR);
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
            }
        }

        return arr.join(JOIN_STR);
    }

    public getContainerComponent(c: Component): string {
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

    public getVolumeComponent(c: Component): string {
        return '';
    }

}
