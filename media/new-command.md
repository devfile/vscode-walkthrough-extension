# Adding commands

You can use a devfile to specify commands to run in a workspace. Every command can contain a subset of actions. The actions in each subset are related to a specific component.

```yaml
commands:
- id: command-1
  exec:
    label: Show Welcome Message
    component: dev
    commandLine: echo "${WELCOME}"
    workingDir: ${PROJECT_SOURCE}

```
