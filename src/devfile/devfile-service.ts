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
import * as devfile from '../devfile';
import { log } from "../logger";

@injectable()
export class DevfileService {

    private devfile: devfile.Devfile | undefined;

    public async init(): Promise<void> {
        // check fot the devfile existence at the startup
    }

    public getDevfile(): devfile.Devfile | undefined {
        return this.devfile;
    }

    // public setDevfile(devfile: devfile.Devfile | undefined): void {
    //     this.devfile = devfile;
    // }

    public newDevfile(name: string): void {
		this.devfile = {
			metadata: {
				name
			},
			components: [],
			commands: []
		} as devfile.Devfile;
    }

    public async isExistOnFileSystem(): Promise<void> {

    }

    public async readFromFileSystem(): Promise<void> {
    }

    public async saveToFileSystem(): Promise<void> {
        log('>>>>>>>>>>>>>>>> SAVE DEVFILE!!!!!!!!');
    }

}
