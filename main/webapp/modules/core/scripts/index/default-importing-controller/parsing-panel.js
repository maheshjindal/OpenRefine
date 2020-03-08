/*

Copyright 2011, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

 * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
 * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

Refine.DefaultImportingController.prototype._showParsingPanel = function(hasFileSelection) {
  var self = this;

  if (!(this._format)) {
    this._format = this._job.config.rankedFormats[0];
  }
  if (!(this._parserOptions)) {
    this._parserOptions = {};
  }
  if (this._formatParserUI) {
    this._formatParserUI.dispose();
    delete this._formatParserUI;
  }
  
  this._prepareParsingPanel();
  this._parsingPanelElmts.nextButton.click(function() {
    self._createProject();
  });
  if (hasFileSelection) {
    this._parsingPanelElmts.previousButton.click(function() {
      self._createProjectUI.showCustomPanel(self._fileSelectionPanel);
    });
  } else {
    this._parsingPanelElmts.previousButton.hide();
  }

  if (!(this._projectName) && this._job.config.fileSelection.length > 0) {
    var index = this._job.config.fileSelection[0];
    var record = this._job.config.retrievalRecord.files[index];
    this._projectName = $.trim(record.fileName.replace(/\W/g, ' ').replace(/\s+/g, ' '));
  }
  if (this._projectName) {
    this._parsingPanelElmts.projectNameInput[0].value = this._projectName;
  }

  this._createProjectUI.showCustomPanel(this._parsingPanel);
};

Refine.DefaultImportingController.prototype._disposeFileSelectionPanel = function() {
  this._disposeParserUI();

  if (this._parsingPanelResizer) {
    $(window).unbind("resize", this._parsingPanelResizer);
  }

  this._parsingPanel.unbind().empty();
  delete this._parsingPanelElmts;
};

Refine.DefaultImportingController.prototype._prepareParsingPanel = function() {
  var self = this;

  this._parsingPanel.unbind().empty().html(
      DOM.loadHTML("core", "scripts/index/default-importing-controller/parsing-panel.html"));

  this._parsingPanelElmts = DOM.bind(this._parsingPanel);
  this._parsingPanelElmts.startOverButton.click(function() {
    self._startOver();
  });
  this._parsingPanelElmts.progressPanel.hide();

  this._parsingPanelElmts.startOverButton.html($.i18n('core-buttons/startover'));
  this._parsingPanelElmts.nextButton.html($.i18n('core-buttons/create-project'));
  $('#or-import-parsopt').text($.i18n('core-index-import/parsing-options'));
  $('#or-import-projname').html($.i18n('core-index-import/project-name'));
  $('#or-import-projtags').html($.i18n('core-index-import/project-tags'));
  $('#or-import-updating').text($.i18n('core-index-import/updating-preview'));
  $('#or-import-parseas').text($.i18n('core-index-import/parse-as'));
  
  //tags dropdown
  $("#tagsInput").select2({
          tags: Refine.TagsManager._getAllProjectTags() ,
          tokenSeparators: [",", " "]
  });
  
  this._parsingPanelResizer = function() {
    var elmts = self._parsingPanelElmts;
    var width = self._parsingPanel.width();
    var height = self._parsingPanel.height();
    var headerHeight = elmts.wizardHeader.outerHeight(true);
    var controlPanelHeight = 300;

    elmts.dataPanel
    .css("left", "0px")
    .css("top", headerHeight + "px")
    .css("width", (width - DOM.getHPaddings(elmts.dataPanel)) + "px")
    .css("height", (height - headerHeight - controlPanelHeight - DOM.getVPaddings(elmts.dataPanel)) + "px");
    elmts.progressPanel
    .css("left", "0px")
    .css("top", headerHeight + "px")
    .css("width", (width - DOM.getHPaddings(elmts.progressPanel)) + "px")
    .css("height", (height - headerHeight - controlPanelHeight - DOM.getVPaddings(elmts.progressPanel)) + "px");

    elmts.controlPanel
    .css("left", "0px")
    .css("top", (height - controlPanelHeight) + "px")
    .css("width", (width - DOM.getHPaddings(elmts.controlPanel)) + "px")
    .css("height", (controlPanelHeight - DOM.getVPaddings(elmts.controlPanel)) + "px");
  };

  $(window).resize(this._parsingPanelResizer);
  this._parsingPanelResizer();

  var formats = this._job.config.rankedFormats;
  var createFormatTab = function(format) {
    var tab = $('<div>')
    .text(Refine.importingConfig.formats[format].label)
    .attr("format", format)
    .addClass("default-importing-parsing-control-panel-format")
    .appendTo(self._parsingPanelElmts.formatsContainer)
    .click(function() {
      self._selectFormat(format);
    });

    if (format == self._format) {
      tab.addClass("selected");
    }
  };
  for (var i = 0; i < formats.length; i++) {
    createFormatTab(formats[i]);
  }
  this._selectFormat(this._format);
  nonPrintableCheckBox();
};

Refine.DefaultImportingController.prototype._disposeParserUI = function() {
  if (this._formatParserUI) {
    this._formatParserUI.dispose();
    delete this._formatParserUI;
  }
  if (this._parsingPanelElmts) {
    this._parsingPanelElmts.optionsContainer.unbind().empty();
    this._parsingPanelElmts.progressPanel.unbind();
    this._parsingPanelElmts.dataPanel.unbind().empty();
  }
};

Refine.DefaultImportingController.prototype._selectFormat = function(newFormat) {
  if (newFormat == this._format && (this._formatParserUI)) {
    // The new format is the same as the existing one.
    return;
  }

  var uiClassName = Refine.importingConfig.formats[newFormat].uiClass;
  var uiClass = Refine.DefaultImportingController.parserUIs[uiClassName];
  if (uiClass) {
    var self = this;
    this._ensureFormatParserUIHasInitializationData(newFormat, function() {
      self._disposeParserUI();
      self._parsingPanelElmts.formatsContainer
      .find(".default-importing-parsing-control-panel-format")
      .removeClass("selected")
      .each(function() {
        if (this.getAttribute("format") == newFormat) {
          $(this).addClass("selected");
        }
      });
      self._format = newFormat;
      self._formatParserUI = new uiClass(
        self,
        self._jobID,
        self._job,
        self._format,
        self._parserOptions[newFormat],
        self._parsingPanelElmts.dataPanel,
        self._parsingPanelElmts.progressPanel,
        self._parsingPanelElmts.optionsContainer
      );
    });
    
  }
};

var controlCharacters = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "TAB", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US", "NBSP"];

function checkNonPrintable(content) {
  var stringIncNonPrintable = "";
  for (var character = 0; character < content.length; character++) {
    var unprintableChar = "";
    var charCode = content.charAt(character).charCodeAt(0);
    if (charCode <= 32) {
      unprintableChar = "<span class='unprintableCharacters' style='background-color: orange'><b>" + controlCharacters[charCode] + "</b></span>";
    }
    stringIncNonPrintable += unprintableChar + content.charAt(character);
  }
  return stringIncNonPrintable;
}

function nonPrintableCheckBox() {
  if ($('#toggle-display-characters').prop('checked')) {
    var rows = $('.data-table tbody > tr');
    var columns;
    for (var i = 0; i < rows.length; i++) {
      columns = $(rows[i]).find('td>div>span');
      for (var j = 0; j < columns.length; j++) {
        var originalContent = $(columns[j]).text();
        console.log("originalContent");
        console.log(originalContent);
        if (originalContent != "") {
          var updatedContent = checkNonPrintable(originalContent);
          $(columns[j]).html(updatedContent);
        }
      }
    }
  }
  else {
    $(".unprintableCharacters").remove();
  }
}

$(document).on('change', '#toggle-display-characters', function () {
  nonPrintableCheckBox();
});