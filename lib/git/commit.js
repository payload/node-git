var sys = require('sys'),
  Actor = require('git/actor').Actor;

// Create a commit object
var Commit = exports.Commit = function(repo, id, parents, tree, author, authored_date, comitter, committed_date, message_lines) {
  var _repo = repo, _id = id, _parents = parents, _tree = tree, _author = author, _authored_date = authored_date;
  var _comitter = comitter, _committed_date = committed_date, _message_lines = message_lines;
  // Internal properties
  Object.defineProperty(this, "repo", { get: function() { return _repo; }, enumerable: true});    
  Object.defineProperty(this, "id", { get: function() { return _id; }, enumerable: true});    
  Object.defineProperty(this, "parents", { get: function() { return _parents; }, enumerable: true});    
  Object.defineProperty(this, "tree", { get: function() { return _tree; }, enumerable: true});    
  Object.defineProperty(this, "author", { get: function() { return _author; }, enumerable: true});    
  Object.defineProperty(this, "authored_date", { get: function() { return _authored_date; }, enumerable: true});    
  Object.defineProperty(this, "comitter", { get: function() { return _comitter; }, enumerable: true});    
  Object.defineProperty(this, "committed_date", { get: function() { return _committed_date; }, enumerable: true});    
  Object.defineProperty(this, "message_lines", { get: function() { return _message_lines; }, enumerable: true});    
}

// Parse the actor and create the object
var actor = function(line) {
  var results = line.match(/^.+? (.*) (\d+) .*$/);
  var actor = results[1];
  var epoch = results[2];
  // Return the objects
  return [Actor.from_string(actor), new Date(parseInt(epoch) * 1000)]
}

var list_from_string = function(repo, text) {
  // Split up the result
  var lines = text.split("\n");
  var commits = [];
  // Parse all commit messages
  while(lines.length > 0) {    
    var id = lines.shift().split(/ /).pop();
    var tree = lines.shift().split(/ /).pop();
    
    // Let's get the parents
    var parents = [];
    while(lines[0].match(/^parent/)) {
      parents.push(lines.shift().split(/ /).pop())
    }
    // Let's get the author and committer
    var actor_info = actor(lines.shift());
    var author = actor_info[0];
    var authored_date = actor_info[1]
    var committer_info = actor(lines.shift());
    var comitter = committer_info[0];
    var committed_date = committer_info[1];
    // Unpack encoding
    var encoding = lines[0].match(/^encoding/) ? lines.shift().split().pop() : '';
    // Jump empty space
    lines.shift();
    
    // Unpack message lines
    var message_lines = [];
    while(lines[0].match(/^ {4}/)) {
      var message_line = lines.shift();
      message_lines.push(message_line.substring(4, message_line.length)) ;
    }
    
    // Move and point to next message
    while(lines[0] != null && lines[0] == '') lines.shift();
    // Create commit object
    commits.push(new Commit(repo, id, parents, tree, author, authored_date, comitter, committed_date, message_lines));
  }
  // Return all the commits
  return commits;
}

// Locate all commits for a give set of parameters
Commit.find_all = function(repo, reference, options, callback) {
  var self = this;
  var args = Array.prototype.slice.call(arguments, 2);
  callback = args.pop();
  options = args.length ? args.shift() : {};    
  
  // Merge the options with the default_options
  if(!options.pretty) options['pretty'] = 'raw';  
  // If we have a reference use that for the lookup
  if(!reference) option['all'] = true;
  // Locate revisions
  repo.git.rev_list(options, reference, function(err, revision_output) {
    if(err) return callback(err, []);
    // Turn string into a list of revisions
    callback(null, list_from_string(repo, revision_output));
  });
}