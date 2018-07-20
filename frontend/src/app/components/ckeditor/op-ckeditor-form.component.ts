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

import {Component, ElementRef, OnInit} from "@angular/core";
import {ConfigurationService} from "core-app/modules/common/config/configuration.service";
import {CurrentProjectService} from "core-components/projects/current-project.service";
import {PathHelperService} from "core-app/modules/common/path-helper/path-helper.service";
import {CKEditorSetupService, ICKEditorInstance} from "core-components/ckeditor/ckeditor-setup.service";
import {HalResource} from "core-app/modules/hal/resources/hal-resource";
import {HalResourceService} from "core-app/modules/hal/services/hal-resource.service";
import {DynamicBootstrapper} from "core-app/globals/dynamic-bootstrapper";

const ckEditorWrapperClass = 'op-ckeditor--wrapper';
const ckEditorReplacementClass = '__op_ckeditor_replacement_container';

@Component({
  selector: 'op-ckeditor-form',
  template: `<div class="${ckEditorWrapperClass}"><div class="${ckEditorReplacementClass}"></div></div>`
})
export class OpCkeditorFormComponent implements OnInit {
  public textareaSelector:string;
  public previewContext:string;

  // Which template to include
  public ckeditor:any;
  public $element:JQuery;
  public formElement:JQuery;
  public wrappedTextArea:JQuery;
  public $attachmentsElement:JQuery;

  // Remember if the user changed
  public changed:boolean = false;
  public inFlight:boolean = false;

  public text:any;
  public resource?:HalResource;


  constructor(protected elementRef:ElementRef,
              protected currentProject:CurrentProjectService,
              protected pathHelper:PathHelperService,
              protected halResourceService:HalResourceService,
              protected ckEditorSetup:CKEditorSetupService,
              protected ConfigurationService:ConfigurationService) {

  }

  public ngOnInit() {
    this.$element = jQuery(this.elementRef.nativeElement);

    // Parse the attribute explicitly since this is likely a bootstrapped element
    this.textareaSelector = this.$element.attr('textarea-selector');
    this.previewContext = this.$element.attr('preview-context');

    // Parse the resource if any exists
    const source = this.$element.data('resource');
    this.resource = source ? this.halResourceService.createHalResource(source, true) : undefined;

    this.formElement = this.$element.closest('form');
    this.wrappedTextArea = this.formElement.find(this.textareaSelector);
    this.wrappedTextArea.hide();
    this.$attachmentsElement = this.formElement.find('#attachments_fields')
    const wrapper = this.$element.find(`.${ckEditorReplacementClass}`);
    const context = { resource: this.resource,
                      previewContext: this.previewContext };

    const editorPromise = this.ckEditorSetup
      .create('classic',
              wrapper[0],
              context)
      .then(this.setup.bind(this));

    this.$element.data('editor', editorPromise);
  }

  public $onDestroy() {
    this.formElement.off('submit.ckeditor');
  }

  public setup(editor:ICKEditorInstance) {
    this.ckeditor = editor;
    (window as any).ckeditor = editor;
    const rawValue = this.wrappedTextArea.val();

    if (rawValue) {
      editor.setData(rawValue);
    }

    // Listen for form submission to set textarea content
    this.formElement.on('submit.ckeditor', () => {
      const value = this.ckeditor.getData();
      this.wrappedTextArea.val(value);

      if (this.resource) {
        const takenIds = this.$attachmentsElement.find("input[type='file']").map((index, input) => {
          let match = (input.getAttribute('name') || '').match(/attachments\[(\d+)\]\[(?:file|id)\]/);

          if (match) {
            return parseInt(match[1]);
          } else {
            return 0;
          }
        });

        const maxValue = takenIds.toArray().sort().pop() || 0;

        let addedAttachments = this.resource.attachments.elements || [];

        jQuery.each(addedAttachments, (index, attachment: HalResource) => {
          this.$attachmentsElement.append(`<input type="hidden" name="attachments[${maxValue + index + 1}][id]" value="${attachment.id}">`);
        });
      }

      // Continue with submission
      return true;
    });

    this.setLabel();

    return editor;
  }

  private setLabel() {
    let textareaId = this.textareaSelector.substring(1);
    let label = jQuery(`label[for=${textareaId}`);

    let ckContent = this.$element.find('.ck-content');

    ckContent.attr('aria-label', null);
    ckContent.attr('aria-labelledby', textareaId);

    label.click(() => {
      ckContent.focus();
    });
  }
}

DynamicBootstrapper.register({ selector: 'op-ckeditor-form', cls: OpCkeditorFormComponent });
