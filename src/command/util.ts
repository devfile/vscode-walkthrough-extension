/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as devfile from "../devfile";

export function countContainerComponents(devfile: devfile.Devfile): number {
    if (!devfile.components) {
        return 0;
    }

    return devfile.components.filter(c => c.container).length;

    // let containerComponents = 0;
    // for (const c of devfile.components) {
    //     if (c.container) {
    //         containerComponents++;
    //     }
    // }

    // return containerComponents;
}