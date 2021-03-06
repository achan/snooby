var _mailbox = {
  onScreenReady: function(element, params) {
    var visited = _cache.itemExists('mailbox.visited');

    if (!visited) {
      _cache.setItem('mailbox.visited', true);
      _cache.setItem('mailbox.screenReady', true);
      _cache.setItem('mailbox.domReady', false);
      _cache.setItem('mailbox.selected', params.mailbox);
      _cache.setItem('mailbox.scrollTop', 0);
    }
  },

  onDomReady: function(element, params) {
    if (_cache.getItem('mailbox.domReady') === true) {
      $('#loading').hide();
      console.log('loading mailbox listings from memory');

      var thiz = this;
      var cachedListing = _cache.getItem('mailbox.listing');
      $.each(cachedListing.data.children, function(index, value) {
        bbr.formatMessage(value, function(bbMessage) {
          $(bbMessage).attr('data-snooby-index', index);
          $(bbMessage).appendTo('#listing');
        });
      });

      setTimeout(function() { 
        thiz.scrollback(cachedListing); 
      }, 0);
    } else {
      console.log('loading mailbox listings from reddit');
      _cache.setItem('mailbox.domReady', true);
      this._updateListing(params.mailbox);
    }

    this._setupContextMenu();
    this._saveQueuedComment();
  },

  _setupContextMenu: function() {
    blackberry.ui.contextmenu.enabled = true;

    var options = {};

    blackberry.ui.contextmenu.defineCustomContext('messageContext', options);

    var reply = { actionId: 'replyAction',
                  label: 'Reply',
                  icon: '../img/icons/ic_edit.png' };

    var markAsUnread = { actionId: 'markAsUnreadAction',
                         label: 'Mark as new',
                         icon: '../img/icons/ic_email.png' };

    var markAsRead = { actionId: 'markAsReadAction',
                       label: 'Mark as read',
                       icon: '../img/icons/ic_email_read.png' };

    var comments = { actionId: 'contextAction',
                     label: 'Full comments',
                     icon: '../img/icons/ic_textmessage.png' };

    blackberry.ui.contextmenu.addItem(['replyReadContext', 'replyUnreadContext'], 
                                      comments, 
                                      this._doFullComments);

    blackberry.ui.contextmenu.addItem(['messageReadContext',
                                       'messageUnreadContext',
                                       'replyReadContext',
                                       'replyUnreadContext'],
                                      reply,
                                      this._doComment);

    blackberry.ui.contextmenu.addItem(['messageReadContext', 'replyReadContext'],
                                      markAsUnread,
                                      this._doMarkAsUnread);

    blackberry.ui.contextmenu.addItem(['messageUnreadContext', 'replyUnreadContext'],
                                      markAsRead,
                                      this._doMarkAsRead);
  },

  _saveQueuedComment: function() {
    if (_cache.itemExists('comment.created')) {
      var user = JSON.parse(_cache.getPersistedItem('snooby.user'));
      var comment = _cache.getItem('comment.created');

      var onsuccess = function() {
        _cache.removeItem('comment.created'); 
        blackberry.ui.toast.show('Message sent.');
      };

      app.comment(comment.data.body, comment.data.parent_id, user.modhash, onsuccess);
    }
  },

  _doComment: function(sourceId) {
    if (rateLimiter.canPerformAction(rateLimiter.COMMENT)) {
      bb.pushScreen('comment.html', 'comment', { parentThing: { data: { name: sourceId } } });
    } else {
      app._rateExceededToast();
    }
  },

  _doMarkAsUnread: function(sourceId) {
    var $status = $('#message-' + sourceId + ' .status').first();

    if (!$status.hasClass('unread')) {
      var user = JSON.parse(_cache.getPersistedItem('snooby.user'));
      app.markAsUnread(sourceId, user.modhash);

      $status.addClass('unread');
      _mailbox._updateContextType(sourceId, false);
    }
  },

  _doMarkAsRead: function(sourceId) {
    var $status = $('#message-' + sourceId + ' .status').first();

    if ($status.hasClass('unread')) {
      var user = JSON.parse(_cache.getPersistedItem('snooby.user'));
      app.markAsRead(sourceId, user.modhash);

      $status.removeClass('unread');
      _mailbox._updateContextType(sourceId, true);
    }
  },

  _updateContextType: function(sourceId, read) {
    var $message = $('#message-' + sourceId),
        context = JSON.parse($message.attr('data-webworks-context')),
        message = _cache.getItem('mailbox.listing')
                        .data
                        .children[$('#message-' + sourceId).attr('data-snooby-index')];

    if (read) {
      context.type = context.type === 'messageUnreadContext' ? 'messageReadContext' : 'replyReadContext';
    } else {
      context.type = context.type === 'messageReadContext' ? 'messageUnreadContext' : 'replyUnreadContext';
    }

    $message.attr('data-webworks-context', JSON.stringify(context));
    message.data.new = !read;
  },

  _doFullComments: function(sourceId) {
    var $message = $('#message-' + sourceId);
    var context = $message.data('snooby-context');
    _mailbox.pushCommentsScreen(context);
  },

  pushCommentsScreen: function(context) {
    bbr._handleRedditCommentLink({ pathname: context.substring(0, context.lastIndexOf('/')) });
  },

  scrollback: function(listing) {
    $('#listing').css('visibility: hidden');
    $('#listing').show();
    $('#mailbox').children('div').eq(1).scrollTop(_cache.getItem('mailbox.scrollTop'));
    $('#listing').css('visibility: visible');
  },

  onUnload: function(element) {
    _cache.setItem('mailbox.scrollTop', $('#mailbox').children('div').eq(1).scrollTop());
  },

  _updateListing: function(mailbox, data) {
    $('#loading').show();
    $('#listing').hide();
    $('#listing').empty();
    var index = 0;
    app.mailbox(mailbox, data, function(message) {
      bbr.formatMessage(message, function(bbMessage) {
        $(bbMessage).attr('data-snooby-index', index++);
        $(bbMessage).appendTo('#listing');
      });
    }, function(listing) {
      $('#loading').hide();
      $('#listing').show();
    });
  },

  messageClicked: function(e) {
    var target = e.target;
    return target && $(target).closest('.message').length > 0;
  },

  onMessageClick: function(target) {
    var name = $(target).closest('.message').data('snooby-message-name');
    _mailbox._doMarkAsRead(name);
  }
};
