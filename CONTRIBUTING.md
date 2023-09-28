Contribute to VS Code Devfile extension
================

### Step 1 : Open this repository in an Eclipse Che cloud development environment

Use this git repository URI to create a workspace using factory

### Step 2 : Compile extension

The first you need to install node dependencies by running the task `devfile: Install dependencies`.
The task progress will be shown in VS Code Terminal output.

Once dependencies have been installed, compile the extension with task `devfile: Compile`.
It will create an `out` directory containing the compiled extension.

### Step 3 : Run the extension in separte VS Code instance

Now you can test the extension in separate VS Code instance.

> Note that it is not possible to launch the extension until you compile it.

To run a separate VS Code instance focus the editor or the `Explorer`, press `F5`. After a few seconds VS Code starts a separate instance in a new browser tab.

In the new VS Code instance a `Welcome` tab is opened with a link to the `Get Started with Devfile` VS Code Walkthrough.
If the VS Code Walkthrough link is not there try expanding the Walkthroughs by clicking `More...` on the right.

### Step 4 : Build `vsix` binary

Run task `devfile: Build vsix binary` to build the extension binary.

In a terminal you may be warned with a message below:

>  **WARNING**  Using '*' activation is usually a bad idea as it impacts performance.

Just type `y` to the terminal and press `Enter` to confirm the build.

When build finished, a new file `redhat-vscode-devfile-0.0.1.vsix` will appear in the project root.

The file can be downloaded and used in other local or remote VS Code instances.

> Installing a vsix binary in VS Code is easy: drag and drop the file into the `Extensions` view.
