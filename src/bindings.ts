/**********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { Container } from 'inversify';
import { NewCommand } from './command/new-command';
import { NewComponent } from './command/new-component';
import { NewDevfile } from './command/new-devfile';
import { SaveDevfile } from './command/save-devfile';
import { DevfileExtensionImpl } from './devfile-extension';
import { DevfileService } from './devfile/devfile-service';
import { DevfileExtension } from './extension-model';

export function initBindings(): Container {
    const container = new Container();

    container.bind(DevfileExtensionImpl).toSelf().inSingletonScope();
    container.bind(DevfileExtension).toService(DevfileExtensionImpl);

    container.bind(DevfileService).toSelf().inSingletonScope();
    container.bind(NewDevfile).toSelf().inSingletonScope();
    container.bind(NewComponent).toSelf().inSingletonScope();
    container.bind(NewCommand).toSelf().inSingletonScope();
    container.bind(SaveDevfile).toSelf().inSingletonScope();

    return container;
}
