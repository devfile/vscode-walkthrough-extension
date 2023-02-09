# Adding a container component

To incorporate custom tools into the workspace, define an image-based configuration of a container in a workspace using the container component type.

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
