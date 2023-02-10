
/**
```
schemaVersion: 2.2.0
metadata:
  name: devfile-sample
```
*/
export interface Devfile {

    metadata: Metadata;
    components: Component[];

}

export interface Metadata {
    name: string;
}

/**
```
components:
  - name: dev
    container:
        image: quay.io/devfile/universal-developer-image:latest
        memoryRequest: 256Mi
        memoryLimit: 2048Mi
        cpuRequest: 0.1
        cpuLimit: 0.5
        mountSources: true
        endpoints:
          - exposure: public
            name: http-demo
            protocol: http
            targetPort: 8080
        env:
          - name: WELCOME
            value: "Hello World"

```
 */
export interface Component {
    name: string;
    container?: ComponentContainer;
}

export interface ComponentContainer {
    image: string;
    memoryRequest?: string;
    memoryLimit?: string;
    cpuRequest?: string;
    cpuLimit?: string;
    mountSources?: boolean;
    endpoints?: ExposedPort[];
    env?: EnvironmentVariable[];
}

export interface ExposedPort {
	visibility: 'public' | 'internal';
	name: string;
	protocol: string;
	port: number;
}

export interface EnvironmentVariable {
	name: string;
	value: string;
}
