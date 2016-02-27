Package.describe({
  name: 'troyxmccall:basecamp-http',
  version: '0.0.1',
  summary: 'Basecamp API Basic HTTP for Meteor',
  git: 'https://github.com/troyxmccall/meteor-basecamp-http.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.5');
  api.use('mongo', 'server');
  api.use('froatsnook:sleep@1.1.0', 'server');
  api.addFiles('basecamp-http.js', 'server');

  if (api.export) {
    api.export('Basecamp', 'server');
  }
});
