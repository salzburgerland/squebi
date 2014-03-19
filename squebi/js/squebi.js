/**
 * the app
 * @type {module|*}
 */
var squeby = angular.module( 'Squeby',[
    'ui.codemirror'
    ,'ui.bootstrap'
]);

/**
 * To register
 */
squeby.service("$extension", function ($rootScope) {

    var extension = {
        resultWriter : []
    };

    function ResultWriter(id,label,format,description,onsuccess,onfailure) {
        this.position = -1;
        this.id = id;
        this.label = label;
        this.description = description;
        this.format = format;
        this.onsuccess = onsuccess;
        this.onfailure = function($scope,data){
            $rootScope.alerts.push(data);
            $scope.template = 'squebi/template/basic.html';
            if(onfailure) onfailure($scope,data);
        };
    }

    this.createResultWriter = function(label,type,description,onsuccess,onfailure) {
        var resultWriter = new ResultWriter(label,type,description,onsuccess,onfailure);
        extension.resultWriter.push(resultWriter);
        return resultWriter;
    }

    this.listResultWriters = function() {
        //order
        extension.resultWriter = extension.resultWriter.sort(function(a,b) {
            return a <= b ? -1 : 1;
        });
        return extension.resultWriter;
    }

    this.selectResultWriter = function(writer) {
        $rootScope.writer = writer;
    }

    this.selectResultWriterById = function(id) {
        for(var i in extension.resultWriter) {
            if(extension.resultWriter[i].id == id) {
                $rootScope.writer = extension.resultWriter[i];
                break;
            }
        }  //TODO should throw an exception?
    }

});

/**
 * a service for sparql endpoints
 */
squeby.service("$sparql", function ($http, SQUEBY) {
    this.query = function(query, options, onsuccess, onfailure) {
        $http({
            url: SQUEBY.serviceURL.select,
            method: "POST",
            data: query,
            headers: {
                'Content-Type': 'application/sparql-query',
                'Accept': options.acceptType
            }
        })
            .success(function(data, status, headers, config) {
                onsuccess(data);
            }).
            error(function(data, status, headers, config) {
                onfailure(data);
            });
    }

    this.update = function(query, options, onsuccess, onfailure) {
        $http({
            url: SQUEBY.serviceURL.update,
            method: "POST",
            data: query,
            headers: {
                'Content-Type': 'application/sparql-update'
            }
        })
            .success(function(data, status, headers, config) {
                onsuccess(data);
            }).
            error(function(data, status, headers, config) {
                onfailure(data);
            });
    }
});

/**
 * A controller to load sample queries from configuration
 */
squeby.controller( 'SampleCtrl', function( SQUEBY, $rootScope, $sparql, $http, $scope, $sce ) {

    $scope.showHint = false;
    $scope.hint = SQUEBY.hints && SQUEBY.hints.length > 0;
    $scope.hints = [];

    function buildHint(hint) {
        var div = jQuery("#"+hint.container);

        switch(hint.position) {
            case 1: hint.style = "top:" + (div.offset().top - hint.dimension.height) + "px;left:" + (div.offset().left + div.width()) + ";";break;
            case 2: hint.style = "top:" + (div.offset().top + div.height()) + "px;left:" + (div.offset().left + div.width()) + ";";break;
            case 3: hint.style = "top:" + (div.offset().top + div.height()) + "px;left:" + (div.offset().left - hint.dimension.width) + ";";break;
            default : hint.style = "top:" + (div.offset().top - hint.dimension.height) + "px;left:" + (div.offset().left - hint.dimension.width) + ";";
        }

        hint.style += "width:" + hint.dimension.width + "px;";
        hint.style += "height:" + hint.dimension.height + "px;";

        if(hint.css) hint.style += hint.css;

        hint.trusted_content = $sce.trustAsHtml(hint.content);

        return hint;
    }

    $scope.showHints = function() {

        $scope.hints = [];

        //prepare hints
        for(var i in SQUEBY.hints) {
            $scope.hints.push(buildHint(SQUEBY.hints[i]));
        }

        $scope.showHint = true;
    }

    $scope.samples = SQUEBY.samples;

    $rootScope.sample = $scope.samples[0].value;

    $scope.selectSample = function(sample) {
        if(sample.type) {
            $rootScope.$emit('setQueryAndWriter', sample.value, sample.type);
        } else {
            $rootScope.$emit('setQuery', sample.value);
        }
    }
});


squeby.controller( 'FormatCtrl', function( SQUEBY, $extension, $rootScope, $sparql, $http, $scope ) {

    $scope.writers = $extension.listResultWriters();

    $rootScope.writer = $rootScope.writer || $scope.writers[0];

    $scope.getClass = function(writer) {
        if(writer == $rootScope.writer) return 'active';
    }

    $scope.selectWriter = function($event,writer) {
        $rootScope.$emit('setWriter',writer.id);
        $event.preventDefault();
    }
});

/**
 * A controller that issues the query
 */
squeby.controller( 'QueryCtrl', function( SQUEBY, $rootScope, $sparql, $http, $scope, $location, $extension ) {

    $scope.query = $rootScope.sample;

    $rootScope.showResults = true;

    /**
     * Autocompletion using prefix.cc
     * @param cm
     */
    function checkAutocomplete(cm) {

        var c = cm.getCursor();
        var line = cm.getRange({'line': c.line, 'ch': 0},{'line': c.line, 'ch': c.ch})
        if(line[line.length - 1] == ':') {
            //get prefix
            var prefix = /.*[\s.,;\{\}]([^:]+):$/g.exec(line)[1];

            var text = cm.getValue();

            var regex = new RegExp("PREFIX\\s+" + prefix + ":\\s*<",'ig');

            //if prefix is not yet defined
            if(!text.match(regex)) {

                CodeMirror.showHint(cm, function(cm, self, data) {

                    var result;

                    //check if it is in static
                    for(var property in SQUEBY.namespaces) {
                        if(SQUEBY.namespaces[property] == prefix) {
                            result = property;
                            break;
                        }
                    }

                    if(result == undefined) {
                        try {
                            jQuery.ajax('http://prefix.cc/' + prefix + '.file.json', {
                                async: false,
                                success: function(data) {
                                    result = data[prefix];
                                },
                                dataType: "json"
                            });
                        } catch (e) {}
                    }

                    if (result !== undefined) {
                        return {
                            list: [{
                                text: "add prefix " + prefix + ": <" + result + ">",
                                hint: function() {

                                    var regex = new RegExp(".*(PREFIX\\s+" + prefix + ":)$",'ig');

                                    if( line.match(regex) ) {
                                        var replacement = " <" + result + ">";
                                        cm.replaceSelection(replacement);
                                        c.ch = c.ch + replacement.length;
                                        cm.setCursor(c);
                                    } else {
                                        c.line = c.line + 1;
                                        cm.setValue("PREFIX " + prefix + ": <" + result+">\n" + cm.getValue());
                                        cm.setCursor(c);
                                    }
                                }

                            }],
                            from: {line: c.line, ch: c.ch - prefix.length},
                            to: {line: c.line, ch: c.ch}
                        }
                    }

                },{
                    completeSingle: false
                });
            }
        }
    }

    //codemirror
    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        mode: 'sparql',
        theme: 'mdn-like sparql-mm',
        //extraKeys: {"Ctrl-Space": "autocomplete"},
        onKeyEvent: function(i, e) {
            if(e.type == 'keyup' && e.keyIdentifier == "Shift") {
                checkAutocomplete(i);
            }
        }
    };

    /**
     * A regex used for query type evaluation
     * @type {RegExp}
     */
    var query_regex = /(DROP)|(INSERT)|(DELETE)|(ASK)|(SELECT)|(CONSTRUCT)|(DESCRIBE)\s/i;

    /**
     * returns the query type if it can be evaluated, undefined otherwise
     * @param query
     * @returns {string}
     */
    function getQueryType(query) {
        var match = query_regex.exec(query);
        return match != undefined ? match[0].toLowerCase() : undefined;
    }

    /**
     * run the query
     */
    $scope.runQuery = function() {
        $rootScope.alerts = [];

        var type = getQueryType($scope.query.trim());

        $rootScope.loader = true;

        switch (type.trim()) {
            case 'insert':
            case 'delete':
            case 'drop':

                $rootScope.showResults = false;

                if(!SQUEBY.basic.updateAllowed) {
                    $rootScope.alerts.push({type: 'info', msg: 'Update queries are not allowed'});
                    break;
                }
                
                $sparql.update(
                    $scope.query.trim(),
                    {},
                    function(){
                        $rootScope.$emit('querySuccess',{type:type, data:{type: 'info', msg: 'Query performed successful'}});
                    }, function(data){
                        $rootScope.$emit('queryFailure',{type: 'danger', msg: data instanceof Object ? data.message : data});
                    }
                );
                break;
            case 'ask':
            case 'select':
            case 'construct':

                var format = type.trim() == 'select' ? 'application/sparql-results+' + $rootScope.writer.format : 'application/' + $rootScope.writer.format;

                $rootScope.showResults = true;
                
                $sparql.query(
                    $scope.query.trim(),
                    {acceptType: format},
                    function(data){
                        $rootScope.$emit('querySuccess',{type:type, data:data, query:$scope.query.trim()});
                    }, function(data){
                        $rootScope.$emit('queryFailure',{type: 'danger', msg: data instanceof Object ? data.message : data});
                    }
                );
                break;
            case 'describe':
                $scope.alerts.push({type:"info",msg:"DESCRIBE query not yet supported"});
                break;
            default :
                $rootScope.alerts.push({type: 'warning', msg: 'Query is not supported'});
        }
    }

    // TODO workaround for codemirror bug
    var query = angular.copy($scope.query);
    $scope.$watch('query',function(a,b){
        if(a!="") query = a;
    })

    $scope.triggerQuery = function() {
        $location.search("query",query);
    }

    $scope.$on('$locationChangeSuccess', function () {

        if($location.search().query == undefined || $location.search().writer == undefined) {
            $location.search({
                query: $location.search().query ? $location.search().query : $scope.query,
                writer: $location.search().writer ? $location.search().writer : $rootScope.writer.id
            });
        } else {
            $scope.query = $location.search().query;
            $extension.selectResultWriterById($location.search().writer);
            $scope.runQuery();
        }
    });

    $rootScope.$on('setQuery', function(e,data) {
        $location.search("query",data);
    });

    $rootScope.$on('setQueryAndWriter', function(e,query,writer) {
        $location.search({
            "query": query,
            "writer": writer
        });
    });

    $rootScope.$on('setWriter', function(e,data) {
        $location.search("writer",data);
    });

});

/**
 * A controller to support alert messages
 */
squeby.controller( 'AlertCtrl', function( SQUEBY, $timeout, $rootScope, $scope ) {

    $rootScope.alerts = [];

    /**
     * remove alert
     * @param alert
     */
    $scope.remove = function(alert) {
        var index = $rootScope.alerts.indexOf(alert);
        if(index != -1) $rootScope.alerts.splice(index,1);
    };
});

squeby.controller( 'ResultCtrl', function( SQUEBY, $timeout, $rootScope, $scope ) {

    $scope.template = 'squebi/template/basic.html';

    $rootScope.$on('querySuccess', function(e,data) {
        $rootScope.alerts = [];
        $rootScope.writer.onsuccess($scope,data,$rootScope);
        $rootScope.loader = false;
    });

    $rootScope.$on('queryFailure', function(e,data) {
        $rootScope.alerts = [];
        $rootScope.writer.onfailure($scope,data,$rootScope);
        $rootScope.loader = false;
    });

});

