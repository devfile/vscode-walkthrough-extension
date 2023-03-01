# Adding a container component

To incorporate custom tools into the workspace, define an image-based configuration of a container in a workspace using the container component type.

```yaml
components:
  - name: dev
    container:
        image: quay.io/devfile/universal-developer-image:latest
        memoryRequest: 256Mi
        memoryLimit: 2048Mi
        cpuRequest: 0.1
        cpuLimit: 0.5
```
