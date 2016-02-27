// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Basecamp API, Basic HTTP Authentication
// https://github.com/basecamp/bcx-api
Basecamp = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Collection for tracking HTTP caching.
Etags = new Mongo.Collection("basecamp_http_etags");

// Check that Meteor.settings.basecamp settings exist.
Basecamp.checkSettings = function() {
  if (
    typeof Meteor.settings.basecamp === 'undefined' ||
    typeof Meteor.settings.basecamp.url === 'undefined' ||
    typeof Meteor.settings.basecamp.agent === 'undefined' ||
    typeof Meteor.settings.basecamp.user === 'undefined' ||
    typeof Meteor.settings.basecamp.pass === 'undefined' ||
    typeof Meteor.settings.basecamp.botName === 'undefined') {
    throw new Meteor.Error(500, "Please add your Basecamp settings to settings.json.");
  }
}

// Rate Limiting
// Limit requests to 500 requests per 10 seconds
// https://github.com/basecamp/bcx-api/#rate-limiting
rateLimit = function() {
  // overly simple rate limiter, 10000ms / 500requests = 20ms between calls
  // TODO a better rate limiter
  Meteor.sleep(20);
}

// Projects | Get Active Projects
// https://github.com/basecamp/bcx-api/blob/master/sections/projects.md
// TODO implement drafts
// TODO implement archived
Basecamp.getProjects = function() {
  var apiUrl = Meteor.settings.basecamp.url + "projects.json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// Projects | Get Archived Projects
// https://github.com/basecamp/bcx-api/blob/master/sections/projects.md
Basecamp.getProjectsArchived = function() {
  var apiUrl = Meteor.settings.basecamp.url + "projects/archived.json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// Accesses | Get People with Access to Project
// https://github.com/basecamp/bcx-api/blob/master/sections/accesses.md
Basecamp.getAccesses = function(project) {
  var apiUrl = Meteor.settings.basecamp.url + "projects/" + project.id + "/accesses.json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// To-do Lists | Get Active To-Do Lists for Project
// https://github.com/basecamp/bcx-api/blob/master/sections/todolists.md
Basecamp.getTodolists = function(project) {
  var apiUrl = Meteor.settings.basecamp.url + "projects/" + project.id + "/todolists.json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// To-do Lists | Get Completed To-Do Lists for Project
// https://github.com/basecamp/bcx-api/blob/master/sections/todolists.md
Basecamp.getTodolistsCompleted = function(project) {
  var apiUrl = Meteor.settings.basecamp.url + "projects/" + project.id + "/todolists/completed.json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// To-Dos | Get To-Do for To-Do List for Project
// https://github.com/basecamp/bcx-api/blob/master/sections/todos.md
Basecamp.getTodos = function(project, todolist) {
  var apiUrl = Meteor.settings.basecamp.url + "projects/" + project.id + "/todolists/" + todolist.id + ".json";
  var response = Meteor.http.get(
    apiUrl,
    httpOptions(apiUrl)
  );
  httpSetCache(apiUrl, response);

  rateLimit();
  return response;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HTTP Options for HTTP.get calls
httpOptions = function(url) {
  var options = {};

  options.timeout = (typeof Meteor.settings.basecamp.httpTimeout === 'undefined') ? 1000 * 5 : Meteor.settings.basecamp.httpTimeout;
  options.headers = httpHeader(url);
  options.auth = Meteor.settings.basecamp.user + ':' + Meteor.settings.basecamp.pass;

  return options;
}

// HTTP Header for HTTP.get calls
httpHeader = function(url) {
  var headers = {};

  headers["User-Agent"] = Meteor.settings.basecamp.agent;

  var cache = httpCache(url);

  if (cache && cache.etag)
    headers["If-None-Match"] = cache.etag;
  else if (cache && cache.lastModified)
    headers["If-Modified-Since"] = cache.lastModified;

  return headers;
}

// Retreive HTTP Cache Info
// https://github.com/basecamp/bcx-api/#use-http-caching
httpCache = function(url) {
  return Etags.findOne({
    url: url
  }, {
    fields: {
      'etag': 1,
      'lastModified': 1
    }
  });
}

// Store HTTP Cache Info
// https://github.com/basecamp/bcx-api/#use-http-caching
httpSetCache = function(url, response) {
  if (typeof response.headers.etag !== 'undefined') {
    Etags.upsert({
      url: url
    }, {
      url: url,
      etag: response.headers.etag,
      lastModified: false
    });
  } else if (typeof response.headers['last-modified'] !== 'undefined') {
    Etags.upsert({
      url: url
    }, {
      url: url,
      etag: false,
      lastModified: response.headers['last-modified']
    });
  }
}
