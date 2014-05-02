//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2014 the OpenProject Foundation (OPF)
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
//++

describe('iconWrapper Directive', function() {
    var compile, element, rootScope, scope;

    beforeEach(angular.mock.module('openproject.uiComponents'));
    beforeEach(module('templates'));

    beforeEach(inject(function($rootScope, $compile) {
      var html;
      html = '<icon-wrapper icon-name="cool-icon.png" title="Nice icon"></icon-wrapper>';

      element = angular.element(html);
      rootScope = $rootScope;
      scope = $rootScope.$new();

      compile = function() {
        $compile(element)(scope);
        scope.$digest();
      };
    }));

    describe('element', function() {
      beforeEach(function() {
        compile();
        expect(element.html()).to.exist;
      });

      it('should render a span', function() {
        expect(element.prop('tagName')).to.equal('SPAN');
      });

      it('should have a title attribute', function() {
        expect(element.attr('title').trim()).to.equal('Nice icon');
      });

      it('should have a class based on its icon name', function() {
        expect(element.hasClass('icon-cool-icon.png')).to.be.ok;
      });

      it('should should have an inner span', function() {
        expect(element.first().prop('tagName')).to.equal('SPAN');
      });
    });
});
