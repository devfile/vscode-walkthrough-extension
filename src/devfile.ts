/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

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
  commands: Command[];
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
    endpoints?: Endpoint[];
    env?: EnvironmentVariable[];
}

export interface Endpoint {
	visibility: 'public' | 'internal';
	name: string;
	protocol: string;
	port: number;
}

export interface EnvironmentVariable {
	name: string;
	value: string;
}

/**
```
commands:
- id: say-hello
  exec:
    component: dev
    commandLine: echo "${WELCOME}"
    workingDir: ${PROJECT_SOURCE}
```
 */
export interface Command {
  id: string;
  component: string;
  commandLine: string;
  workingDir: string;
}

export interface DevfileHolder {

  devfile: Devfile;

}
