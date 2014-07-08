define([
  'knockout',
  'observer',
  'server'
], function(ko, observer, server) {
  var nameSubs, descriptionsSubs;

  var page = {
    pageTitle: 'Programs',
    loading: ko.observable(false),
    error: ko.observable(""),
    valves: ko.observableArray([
      { id: "V01", name: "HERMS ut",     state: ko.observable(false) },
      { id: "V02", name: "HLT förbi",    state: ko.observable(false) },
      { id: "V03", name: "HERMS in",     state: ko.observable(false) },
      { id: "V04", name: "Utlopp HLT",   state: ko.observable(false) },
      { id: "V05", name: "Utlopp MLT",   state: ko.observable(false) },
      { id: "V06", name: "Utlopp KET",   state: ko.observable(false) },
      { id: "V07", name: "Till HLT",     state: ko.observable(false) },
      { id: "V08", name: "P1 till MLT",  state: ko.observable(false) },
      { id: "V09", name: "P2 till MLT",  state: ko.observable(false) },
      { id: "V10", name: "Till KET",     state: ko.observable(false) },
      { id: "V11", name: "Till FV",      state: ko.observable(false) },
      { id: "P1",  name: "Vatten",       state: ko.observable(false) },
      { id: "P2",  name: "Vatten, Vört", state: ko.observable(false) }
    ]),
    selected: ko.observable(false),
    name: ko.observable(""),
    description: ko.observable(""),
    newProgramName: ko.observable(""),
    programs: ko.observableArray(),
    load: function(id) {
      observer.publish('page', 'programs');

      if (!nameSubs) {
        this.name.subscribe(function(value) {
          this.saveProgram();
        }.bind(this));
      }

      if (!descriptionsSubs) {
        descriptionsSubs = this.description.subscribe(function(value) {
          this.saveProgram();
        }.bind(this));
      }

      this.selected(id ? id : false);
      this.loading(true);
      this.error("");

      server.send("loadPrograms", {}, function(error, programs) {
        this.loading(false);

        if (error) {
          this.error(error);
          return;
        }

        this.programs(programs);

        if (!this.selected() && this.programs().length > 0) {
          document.location.hash = "#/programs/" + this.programs()[0].id;
        } else if (this.selected()) {
          for (var n = 0; n < this.programs().length; n++) {
            if (this.programs()[n].id === this.selected()) {
              this.loading(true);

              this.name(this.programs()[n].name);
              this.description(this.programs()[n].description);

              for (var i = 0; i < this.valves().length; i++) {
                this.valves()[i].state(this.programs()[n].valves.indexOf(this.valves()[i].id) !== -1);
              }

              this.loading(false);
            }
          }
        }
      }.bind(this));
    },
    saveProgram: function() {
      if (this.loading()) {
        return;
      }

      this.loading(true);
      this.error("");

      var program = {};
      program.id = this.selected();
      program.name = this.name();
      program.description = this.description();
      program.valves = [];

      for (var i = 0; i < this.valves().length; i++) {
        if (this.valves()[i].state()) {
          program.valves.push(this.valves()[i].id);
        }
      }

      server.send("saveProgram", program, function(error, program) {
        this.loading(false);

        if (error) {
          this.error(error);
          return;
        }
      }.bind(this));
    },
    addProgram: function() {
      this.loading(true);
      this.error("");

      server.send("addProgram", this.newProgramName(), function(error, program) {
        this.loading(false);

        if (error) {
          this.error(error);
          return;
        }

        this.newProgramName("");
        document.location.hash = "#/programs/" + program.id;
      }.bind(this));
    },
    valveHandler: function(valve) {
      valve.state(!valve.state());
      page.saveProgram();
    }
  };

  return page;
});
