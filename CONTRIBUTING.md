Contribute to VS Code Devfile extension
================

### Step 1 : Create workspace

Use this git repository URI to create a workspace using factory

### Step 2 : Compile extension

The first you need to install node dependencies by running task `devfile: Install dependencies`.
The task progress will be shown in the output below.

Once dependencies have beeen installed, you have to compile the extension with task `devfile: Compile`.
It will create `out` directory containing the compiled extension.

### Step 3 : Run the extension in separte VS Code instance

Now you can test the extension in separate VS Code instance.

> Note that it is not possible to launch the extension until you compile it.

At this step it is enough to focus the editor or the `Explorer`, press `F5` and VS Code will start a separate instance in a new browser tab.

A new `Get Started with Devfile` walkthrough item should appear in the `Welcome` tab.
If the item is not there, it could probably need to expand the walkthrougs by clicking `More...` on the right.

### Step 4 : Build `vsix` binary

Run task `devfile: Build vsix binary` to build the extension binary.

In a terminal you may be warned with a message below:

>  **WARNING**  Using '*' activation is usually a bad idea as it impacts performance.

Just type `y` to the terminal and press `Enter` to confirm the build.

When build finished, a new file `redhat-vscode-devfile-0.0.1.vsix` will appear in the project root.

The file can be downloaded to easily use it in another VS Code instances.

> It is easy to install vsix binary to any VS Code. You have only to drag and drop the file into the `Extensions` view.
