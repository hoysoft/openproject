// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {WorkPackageResource} from 'core-app/modules/hal/resources/work-package-resource';
import {WorkPackageCacheService} from '../../work-packages/work-package-cache.service';
import {WorkPackageNotificationService} from '../wp-notification.service';
import {States} from '../../states.service';
import {WorkPackageEditForm} from '../../wp-edit-form/work-package-edit-form';
import {
  displayClassName,
  DisplayFieldRenderer,
  editFieldContainerClass
} from '../../wp-edit-form/display-field-renderer';
import {WorkPackageEditFieldHandler} from '../../wp-edit-form/work-package-edit-field-handler';
import {WorkPackageEditingService} from '../../wp-edit-form/work-package-editing-service';
import {SelectionHelpers} from '../../../helpers/selection-helpers';
import {debugLog} from '../../../helpers/debug_output';
import {Component, ElementRef, Inject, Injector, Input, OnInit, ViewChild} from '@angular/core';
import {WorkPackageEditFieldGroupComponent} from 'core-components/wp-edit/wp-edit-field/wp-edit-field-group.directive';
import {ConfigurationService} from 'core-app/modules/common/config/configuration.service';
import {OPContextMenuService} from "core-components/op-context-menu/op-context-menu.service";
import {NotificationsService} from 'core-app/modules/common/notifications/notifications.service';
import {I18nService} from 'core-app/modules/common/i18n/i18n.service';
import {IFieldSchema} from "core-app/modules/fields/field.base";
import {ClickPositionMapper} from "core-app/modules/common/set-click-position/set-click-position";
import {IWorkPackageEditingServiceToken} from "../../wp-edit-form/work-package-editing.service.interface";

@Component({
  selector: 'wp-edit-field',
  templateUrl: './wp-edit-field.html'
})
export class WorkPackageEditFieldComponent implements OnInit {
  @Input('fieldName') public fieldName:string;
  @Input('workPackageId') public workPackageId:string;
  @Input('wrapperClasses') public wrapperClasses?:string;
  @Input('displayPlaceholder') public displayPlaceholder?:string;

  @ViewChild('displayContainer') readonly displayContainer:ElementRef;
  @ViewChild('editContainer') readonly editContainer:ElementRef;

  public workPackage:WorkPackageResource;
  public fieldRenderer = new DisplayFieldRenderer(this.injector, 'single-view');
  public editFieldContainerClass = editFieldContainerClass;
  public active = false;
  private $element:JQuery;

  constructor(protected states:States,
              protected injector:Injector,
              protected elementRef:ElementRef,
              protected wpNotificationsService:WorkPackageNotificationService,
              protected ConfigurationService:ConfigurationService,
              protected opContextMenu:OPContextMenuService,
              @Inject(IWorkPackageEditingServiceToken) protected wpEditing:WorkPackageEditingService,
              protected wpCacheService:WorkPackageCacheService,
              // Get parent field group from injector
              protected wpEditFieldGroup:WorkPackageEditFieldGroupComponent,
              protected NotificationsService:NotificationsService,
              readonly I18n:I18nService) {

  }

  public ngOnInit() {
    this.$element = jQuery(this.elementRef.nativeElement);
    this.wpEditFieldGroup.register(this);
  }

  public render() {
    const el = this.fieldRenderer.render(this.resource, this.fieldName, null, this.displayPlaceholder);
    this.displayContainer.nativeElement.innerHTML = '';
    this.displayContainer.nativeElement.appendChild(el);
  }

  public deactivate(focus:boolean = false) {
    this.editContainer.nativeElement.innerHTML = '';
    this.editContainer.nativeElement.hidden = true;
    this.active = false;

    if (focus) {
      setTimeout(() => this.$element.find(`.${displayClassName}`).focus(), 20);
    }
  }

  public get resource() {
    return this.wpEditing
      .temporaryEditResource(this.workPackageId)
      .getValueOr(this.wpEditFieldGroup.workPackage);
  }

  public get isEditable() {
    const fieldSchema = this.resource.schema[this.fieldName] as IFieldSchema;
    return this.resource.isEditable && fieldSchema && fieldSchema.writable;
  }

  public activateIfEditable(event:JQueryEventObject) {
    // Ignore selections
    if (SelectionHelpers.hasSelectionWithin(event.target)) {
      debugLog(`Not activating ${this.fieldName} because of active selection within`);
      return true;
    }

    if (this.isEditable) {
      this.handleUserActivate(event);
    }

    this.opContextMenu.close();
    event.stopImmediatePropagation();

    return false;
  }

  public activate(noWarnings:boolean = false):Promise<WorkPackageEditFieldHandler> {
    this.active = true;
    return this.activateOnForm(this.wpEditFieldGroup.form, noWarnings);
  }

  public activateOnForm(form:WorkPackageEditForm, noWarnings:boolean = false) {
    // Activate the field
    const promise = form.activate(this.fieldName, noWarnings);
    promise
      .then(() => this.active = true)
      .catch(() => this.deactivate(true));

    return promise;
  }

  public handleUserActivate(evt:JQueryEventObject|null) {
    let positionOffset = 0;

    if (evt) {
      // Skip activation if the user clicked on a link
      const target = jQuery(evt.target);

      if (target.closest('a', this.displayContainer.nativeElement).length > 0) {
        return true;
      }

      // Get the position where the user clicked.
      positionOffset = ClickPositionMapper.getPosition(evt);
    }

    this.activate()
      .then((handler) => {
        handler.focus(positionOffset);
      });

    return false;
  }

  public reset(workPackage:WorkPackageResource) {
    this.workPackage = workPackage;
    this.render();

    this.deactivate();
  }

}
