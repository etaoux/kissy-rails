//= require kissy-sizzle
KISSY.ready(function(S){
/**
 * Unobtrusive scripting adapter for Kissy
 *
 * Requires Kissy 1.2.0 or later.
 */

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;

  KISSY.rails = rails = {
    // Link elements bound by kissy_ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with]',

    // Select elements bound by kissy_ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by kissy_ujs
    formSubmitSelector: 'form',

    // Form input elements bound by kissy_ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not(button[type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with], button[data-disable-with], textarea[data-disable-with]',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input:file',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with]',

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function(xhr) {
      var token = S.all('meta[name="csrf-token"]').attr('content');
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function(obj, name, data) {
      return obj.fire(name, data);
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in KISSY.rails.confirm
    confirm: function(message) {
      return confirm(message);
    },

    // Default ajax function, may be overridden with custom function in KISSY.rails.ajax
    ajax: function(options) {
      return S.io(options);
    },

    // Default way to get an element's href. May be overridden at KISSY.rails.href.
    href: function(element) {
      return element.attr('href');
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function(element) {
      var method, url, data, crossDomain, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        crossDomain = element.attr('data-cross-domain') || null;
        dataType = element.attr('data-type')

        if (element.test('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = {}
          inputs = S.io.serialize(element).split("&");
          for(var i=0;i<inputs.length;i++){
            item = inputs[i].split("=")
            data[decodeURIComponent(item[0])] = decodeURIComponent(item[1])
          }

          // memoized value from clicked submit button
          var button = element.attr('data-ujs:submit-button');
          if (button) {
            // data.push(button);
            element.attr('data-ujs:submit-button', null);
          }
        } else if (element.test(rails.inputChangeSelector)) {
          method = element.attr('data-method');
          url = element.attr('data-url');
          data = element.serialize();
          if (element.attr('data-params')) data = data + "&" + element.attr('data-params');
        } else {
          method = element.attr('data-method');
          url = rails.href(element);
          data = element.attr('data-params') || null;
        }

        ajax_header = {}
        if (dataType === undefined) {
          ajax_header = {
            'accept' : '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript'
          }
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType, crossDomain: crossDomain,
          headers : ajax_header,
          success: function(data, status, xhr) {
            element.fire('ajax:success', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            element.fire('ajax:complete', [xhr, status]);
          },
          error: function(xhr, status, error) {
            element.fire('ajax:error', [xhr, status, error]);
          }
        };
        // Only pass url to `ajax` options if not blank
        if (url) { options.url = url; }

         rails.fire(element, 'ajax:beforeSend')
        return rails.ajax(options);
      } else {
        return false;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function(link) {
      var href = rails.href(link),
        method = link.attr('data-method'),
        target = link.attr('target'),
        csrf_token = S.one('meta[name=csrf-token]').attr('content'),
        csrf_param = S.one('meta[name=csrf-param]').attr('content'),
        form = S.one('<form method="post" action="' + href + '"></form>'),
        metadata_input = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrf_param !== undefined && csrf_token !== undefined) {
        metadata_input += '<input name="' + csrf_param + '" value="' + csrf_token + '" type="hidden" />';
      }

      if (target) { form.attr('target', target); }

      form.hide().append(metadata_input).appendTo('body');
      form[0].submit();
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function(form) {
      S.query(rails.disableSelector, form).each(function(el) {
        element = S.one(el);
        var method = element.test('button') ? 'html' : 'val';
        element.attr('data-ujs:enable-with', element[method]());
        element[method](element.attr('data-disable-with'));
        element.prop('disabled', true);
      });
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function(form) {
      S.query(rails.enableSelector,form).each(function(el) {
        element = S.one(el);
        var method = element.test('button') ? 'html' : 'val';
        if (element.attr('data-ujs:enable-with')) element[method](element.attr('data-ujs:enable-with'));
        element.prop('disabled', false);
      });
    },

   /* For 'data-confirm' attribute:
      - Fires `confirm` event
      - Shows the confirmation dialog
      - Fires the `confirm:complete` event

      Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
      Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
      Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
      return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
   */
    allowAction: function(element) {
      var message = element.attr('data-confirm'),
          answer = false, callback;
      if (!message) { return true; }

      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function(form, specifiedSelector, nonBlank) {
      var inputs = S.all(), input,
        selector = specifiedSelector || 'input,textarea';
      S.query(selector,form).each(function(input) {
        // Collect non-blank inputs if nonBlank option is true, otherwise, collect blank inputs
        if (nonBlank ? input.val() : !input.val()) {
          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function(e) {
      S.one(e.target).fire('ujs:everythingStopped');
      e.halt();
      return false;
    },

    // find all the submit events directly bound to the form and
    // manually invoke them. If anyone returns false then stop the loop
    callFormSubmitBindings: function(form, event) {
      var events = form.attr('data-events'), continuePropagation = true;
      if (events !== undefined && events['submit'] !== undefined) {
        S.each(events['submit'], function(i, obj){
          if (typeof obj.handler === 'function') return continuePropagation = obj.handler(event);
        });
      }
      return continuePropagation;
    },

    //  replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function(element) {
      element.attr('data-ujs:enable-with', element.html()); // store enabled state
      element.html(element.attr('data-disable-with')); // set to disabled state
      element.bind('click.railsDisable', function(e) { // prevent further clicking
        return rails.stopEverything(e)
      });
    },

    // restore element to its original state which was disabled by 'disableElement' above
    enableElement: function(element) {
      if (element.attr('data-ujs:enable-with') !== undefined) {
        element.html(element.attr('data-ujs:enable-with')); // set to old enabled state
        // this should be element.removeattr('data-ujs:enable-with')
        // but, there is currently a bug in kissy which makes hyphenated data attributes not get removed
        element.attr('data-ujs:enable-with', false); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
    }

  };

  // S.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { rails.CSRFProtection(xhr); }});

  S.Event.delegate(document, 'ajax:complete' , rails.linkDisableSelector, function(e) {
      rails.enableElement(S.one(e.target));
  });

  S.Event.delegate(document, 'click',rails.linkClickSelector, function(e) {
    var link = KISSY.one(e.target), method = link.attr('data-method'), data = link.attr('data-params');
    if (!rails.allowAction(link)) {
      return rails.stopEverything(e);
    }

    if (link.hasClass(rails.linkDisableSelector)) rails.disableElement(link);

    if (link.attr('data-remote') !== undefined) {
      if ( (e.metaKey || e.ctrlKey) && (!method || method === 'GET') && !data ) { return true; }

      if (rails.handleRemote(link) === false) { rails.enableElement(link); }
      e.halt();
      return false;

    } else if (link.attr('data-method')) {
      rails.handleMethod(link);
      e.halt();
      return false;
    }
  });

  S.Event.delegate(document, 'change', rails.inputChangeSelector, function(e) {
    var link = S.one(e.target);
    if (!rails.allowAction(link)) return rails.stopEverything(e);

    rails.handleRemote(link);
    e.halt();
    return false;
  });

  S.Event.delegate(document, 'submit', rails.formSubmitSelector, function(e) {
    var form = S.one(e.target),
      remote = form.attr('data-remote') !== undefined,
      blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector),
      nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);

    if (!rails.allowAction(form)) return rails.stopEverything(e);

    // skip other logic when required values are missing or file upload is present
    if (blankRequiredInputs && form.attr("novalidate") == undefined && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
      return rails.stopEverything(e);
    }

    if (remote) {
      if (nonBlankFileInputs) {
        return rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);
      }

      // If browser does not support submit bubbling, then this live-binding will be called before direct
      // bindings. Therefore, we should directly call any direct bindings before remotely submitting form.
      // if (!$.support.submitBubbles && $().jquery < '1.7' && rails.callFormSubmitBindings(form, e) === false) return rails.stopEverything(e);

      rails.handleRemote(form);
      e.halt();
      return false;

    } else {
      // slight timeout so that the submit button gets properly serialized
      setTimeout(function(){ rails.disableFormElements(form); }, 13);
    }
  });

  S.Event.delegate(document, 'click', rails.formInputClickSelector, function(event) {
    var button = S.one(event.target);

    if (!rails.allowAction(button)) return rails.stopEverything(event);

    // register the pressed submit button
    var name = button.attr('name'),
      data = name ? {name:name, value:button.val()} : null;

    button.closest('form').attr('data-ujs:submit-button', data.name);
  });

  S.Event.delegate(document, 'ajax:beforeSend', rails.formSubmitSelector, function(event) {
    if (event.target.tagName.toLowerCase() == "form") rails.disableFormElements(S.one(event.target));
  });

  S.Event.delegate(document, 'ajax:complete', rails.formSubmitSelector, function(event) {
    if (event.target.tagName.toLowerCase() == "form") rails.enableFormElements(S.one(event.target));
  });

});
