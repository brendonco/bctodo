// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){
  // Todo Model
  // ----------

  var Util = function(){
    this.maxCharSize = 30;

    this.isDialogShown = false;

    this.getAlphaNumericMsg =function(){
      return {
        title: "Only alpha numeric string are allowed.",
        note: "Characters that are allowed: 1-9, a-z"
      };
    }

    this.getDeleteErrorMsg = function(){
      return {
        title: "Please mark the entry as complete before deleting.",
        note: "Tick any todo item to mark as completed."
      };
    }

    this.dialogTemplate = _.template($('#dialog-template').html());
    this.dialogContainer = $('#dialogContainer');

    $('#dialogModal').hide();
  }

  Util.prototype.formatDateTime = function(){
    var date = new Date();
    var createUpdateDateTime = date.getDay() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    return createUpdateDateTime; 
  }

  Util.prototype.trimCharMoreThanThirty = function(trimChar){
      trimChar = this.trimExtraSpace(trimChar);

      if(trimChar.length > this.maxCharSize){
        trimChar = trimChar.substring(0, trimChar.length - (trimChar.length - this.maxCharSize));
      }
      return trimChar;
  }

  Util.prototype.trimExtraSpace = function(trimChar){
    return trimChar.replace(/\s\s+/g, ' ');
  }

  Util.prototype.isAlphaNumeric = function(value){
    return /^[a-zA-Z1-9]+$/gi.test(value);
  }

  //Refer to bootstrap modal
  //http://getbootstrap.com/javascript/#modals
  Util.prototype.showDialog = function(data){
    this.dialogContainer.html(this.dialogTemplate({
        title: data.title,
          note: data.note
    }));

    var self = this;

    //Clear the timer if active
    //This will allow not closing the current dialog.
    if(this.isTimerActive){
      clearTimeout(this.isTimerActive);
    }

    function setDialogState(isShown){
      self.isDialogShown = isShown;
    }

    if(!self.isDialogShown){
      self.isDialogShown = true;

      $("#dialogModal").modal('show');

      this.isTimerActive = window.setTimeout(function(){
        $('#dialogModal').modal('hide');
      }, 3000);
    }

    $('#dialogModal').on('shown.bs.modal', function (e) {
      if (self.isDialogShown) return e.preventDefault(); // stops modal from being shown
    });

    $('#dialogModal').on('hidden.bs.modal', function (e) {
      setDialogState(false);
    });
  }

  // Our basic **Todo** model has `title`, `order`, and `done` attributes.
  var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        title: "empty todo...",
        timestamp: AppView.prototype.util.formatDateTime(),//this.formatDateTime(),
        order: Todos.nextOrder(),
        done: false
      };
    },

    // Ensure that each todo created has `title`.
    initialize: function() {
      if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  var TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Save all of the todo items under the `"todos-backbone"` namespace.
    localStorage: new Backbone.LocalStorage("todos-backbone"),

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    },

    search: function(value){
      if(value === "") return this;
      
      var regexPattern = new RegExp(value, "gi");

      return _(this.filter(function(data){
        return regexPattern.test(data.get("done"));
      }));
    }

  });

  // Create our global collection of **Todos**.
  var Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the todo item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        // this.model.save({title: value, timestamp: Todo.prototype.formatDateTime()});

        //Check for Alpha Numeric characters
        if(!AppView.prototype.util.isAlphaNumeric(this.input.val())){
          //alert("Alpha numeric string is allowed.");
          AppView.prototype.util.showDialog(AppView.prototype.util.getAlphaNumericMsg());
          return;
        }

        //trim to 30 characters
        var trimChar = AppView.prototype.util.trimCharMoreThanThirty(value);

        this.model.save({title: trimChar, timestamp: AppView.prototype.util.formatDateTime()});

        // this.model.save({title: value, timestamp: AppView.prototype.util.formatDateTime()});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      var done = Todos.done().length;

      if(done > 0){
        this.model.destroy();
      }else{
        AppView.prototype.util.showDialog(AppView.prototype.util.getDeleteErrorMsg());
      }
    }
  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-todo":  "createOnEnter",
      "keypress #search-todo":  "searchOnKeypressed",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#new-todo");
      this.searchinput = this.$("#search-todo");

      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      this.dialogContainer = $('#dialogContainer');

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      //Check for Alpha Numeric characters
      if(!AppView.prototype.util.isAlphaNumeric(this.input.val())){
        AppView.prototype.util.showDialog(AppView.prototype.util.getAlphaNumericMsg());
        return;
      }

      //trim to 30 characters
      var trimChar = AppView.prototype.util.trimCharMoreThanThirty(this.input.val());

      // Todos.create({title: this.input.val()});
      Todos.create({title: trimChar});
      this.input.val('');
    },

    renderTodoList: function(filterTodoList){
        filterTodoList.each(function(item){
           console.log(item);
        });
    },

    searchOnKeypressed: function(e){
      if (!this.searchinput.val() || this.searchinput.val().length < 3) return;

      var value = this.searchinput.val();

      var filterValue = Todos.search(value);

      this.renderTodoList(filterValue);
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    },

    util: new Util()

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
