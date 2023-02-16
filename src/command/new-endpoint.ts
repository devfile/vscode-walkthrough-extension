/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { inject, injectable } from "inversify";
import { log } from "../logger";
import { DevfileService } from "../devfile/devfile-service";
import { NewEndpoint } from "../model/extension-model";

@injectable()
export class NewEndpointImpl implements NewEndpoint {

	@inject(DevfileService)
    private service: DevfileService;

    async run(): Promise<boolean> {
		log('NewEndpointImpl::run()');

        try {


        } catch (err) {
            log(`ERROR occured: ${err.message}`);
        }

        return false;
    }

}
