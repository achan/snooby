var _settings = {
  doLogin: function() {
    document.getElementById('loginButton').setCaption('Logging in... <i class="icon-spinner icon-spin"></i>');
    var username = $('#username').val();
    var password = $('#password').val();
    app.login(username, password, function(data, status, xhr) {
      if (data.json.errors.length === 0) {
        var user = { username: username, password: password, modhash: data.json.data.modhash };
        _cache.setItem('subreddit.screenReady', false);
        _cache.setItem('subreddit.domReady', false);
        _cache.setItem('subreddit.selected', 'frontpage');
        _cache.persistItem('snooby.user', JSON.stringify(user));
        _cache.removePersistedItem('subreddit.list');
        _cache.removePersistedItem('snooby.subreddits');
        _cache.removePersistedItem('snooby.subreddits.actionBar');

        app.subreddits(null, function() {
          var html = Mustache.to_html($('#loggedUserTemplate').html(), { username: username });
          $('#currentLogin').html(html);
          $('#loginPanel').hide();
          $('#accountPanel').show();
          $('#password').val('');

          document.getElementById('loginButton').setCaption('<i class="icon-signin"> Login</i>');
        });
      } else if (data.json.errors[0][0] === 'WRONG_PASSWORD') {
        blackberry.ui.dialog.customAskAsync('Incorrect username or password.',
                                            ['OK'],
                                            null,
                                            { title: 'Login Error' });
        document.getElementById('loginButton').setCaption('<i class="icon-signin"> Login</i>');
      } else if (data.json.errors[0][0] === 'RATELIMIT') {
        blackberry.ui.dialog.customAskAsync(data.json.errors[0][1],
                                            ['OK'],
                                            null,
                                            { title: 'Login Error' });
        document.getElementById('loginButton').setCaption('<i class="icon-signin"> Login</i>');
      }
    });
  },

  doLogout: function() {
    document.getElementById('logoutButton').setCaption('Logging out... <i class="icon-spinner icon-spin"></i>');
    var user = JSON.parse(_cache.getPersistedItem('snooby.user'));
    app.logout(user.modhash, function() {
      _cache.setItem('subreddit.screenReady', false);
      _cache.setItem('subreddit.domReady', false);
      _cache.setItem('subreddit.selected', 'frontpage');
      _cache.removePersistedItem('subreddit.list');
      _cache.removePersistedItem('snooby.user');
      _cache.removePersistedItem('snooby.subreddits');
      _cache.removePersistedItem('snooby.subreddits.actionBar');
      app.subreddits(null, function() {
        $('#loginPanel').show();
        $('#accountPanel').hide();
        document.getElementById('logoutButton').setCaption('<i class="icon-signout"> Log Out</i>');
      });
    });
  },
  
  onScreenReady: function(element, params) {
    var loggedUser = JSON.parse(_cache.getPersistedItem("snooby.user"));
    if (loggedUser === null) {
      element.getElementById('loginPanel').style.display = 'block';
    } else {
      var html = Mustache.to_html(element.getElementById('loggedUserTemplate').innerHTML,
                                  { username: loggedUser.username });
      element.getElementById('currentLogin').innerHTML = html;
      element.getElementById('accountPanel').style.display = 'block';
    }
  }
};
