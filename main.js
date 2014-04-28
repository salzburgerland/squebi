if(window.SQUEBI == undefined) SQUEBI = {};

SQUEBI.app = SQUEBI.app || ".";
SQUEBI.bower = SQUEBI.bower || "bower_components";
SQUEBI.container = SQUEBI.container || "#squebi";
SQUEBI.appLoader = SQUEBI.appLoader || "#appLoader";

requirejs.config({
    paths: {
        async : SQUEBI.bower + "/requirejs-plugins/src/async",
        propertyParser : SQUEBI.bower + "/requirejs-plugins/src/propertyParser",
        goog : SQUEBI.bower + "/requirejs-plugins/src/goog",
        jquery : SQUEBI.bower + "/jquery/dist/jquery",
        angular : SQUEBI.bower + "/angular/angular",
        angularLocalStorage : SQUEBI.bower + "/angular-local-storage/angular-local-storage",
        _bootstrap : SQUEBI.bower + "/bootstrap/dist/js/bootstrap",
        bootstrapUI : SQUEBI.bower + "/angular-bootstrap/ui-bootstrap",
        uiBootstrapTpls: SQUEBI.bower + "/angular-bootstrap/ui-bootstrap-tpls",
        _codemirror : SQUEBI.bower + "/codemirror/lib/codemirror",
        codemirrorSparql : SQUEBI.bower + "/codemirror/mode/sparql/sparql",
        codemirrorUI : SQUEBI.bower + "/angular-ui-codemirror/ui-codemirror",
        codemirrorHint : SQUEBI.bower + "/codemirror/addon/hint/show-hint",
        _squebi : "squebi/js/squebi",
        squebiBrowse : "squebi/js/writer/squebi.browse",
        squebiJson : "squebi/js/writer/squebi.json",
        squebiXml : "squebi/js/writer/squebi.xml",
        squebiPie: "squebi/js/writer/squebi.pie",
        squebiRdfdot: "squebi/js/writer/squebi.rdfdot"
        //rdfstoreJs: SQUEBI.bower + "/rdfstore-js/dist/browser/rdf_store"
    },
    shim: {
        'goog': ['async','propertyParser'],
        'angular' : ['jquery'],
        '_bootstrap' : ['jquery'],
        'bootstrapUI' : ['angular','_bootstrap'],
        'angularLocalStorage' : ['angular'],
        'uiBootstrapTpls' : ['bootstrapUI'],
        'codemirrorSparql' : ['_codemirror'],
        'codemirrorUI' : ['_codemirror','bootstrapUI'],
        'codemirrorHint' : ['_codemirror'],
        '_squebi' : ['codemirrorHint','codemirrorUI','codemirrorSparql','bootstrapUI','uiBootstrapTpls','angularLocalStorage'],//,'rdfstoreJs'
        'squebiBrowse' : ['_squebi'],
        'squebiJson' : ['_squebi'],
        'squebiXml' : ['_squebi'],
        'squebiRdfdot' : ['_squebi'],
        'squebiPie' : ['_squebi']
    },map: {
        '*': {
            '_css': SQUEBI.bower + '/require-css/css'
        }
    }
});

require([
    "squebiBrowse",
    "squebiJson",
    "squebiXml",
    "squebiRdfdot",
    'goog!visualization,1,packages:[corechart]',
    "squebiPie",
    "_css!squebi/css/flags",
    "_css!" + SQUEBI.bower + "/bootstrap/dist/css/bootstrap",
    "_css!" + SQUEBI.bower + "/codemirror/lib/codemirror",
    "_css!" + SQUEBI.bower + "/codemirror/theme/neat",
    "_css!" + SQUEBI.bower + "/codemirror/addon/hint/show-hint",
    "_css!" + SQUEBI.bower + "/fontawesome/css/font-awesome",
    "_css!squebi/css/style"
], function() {

    angular.element(document).ready(function($http,$rootScope) {

        var defaultConfig = {
            "configurable" : false,
            "selectService": "http://example.org/sparql/select",
            "updateService": "http://example.org/sparql/update",
            "samples": [
                {
                    "name": "10 events in April 2014",
                    "value": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                             "PREFIX cal: <http://www.w3.org/2002/12/cal#>\n" +
                             "SELECT ?s ?start ?end WHERE {\n" +
                             " ?s a <http://schema.org/Event> ;\n" +
                             "    cal:dtstart ?start ;\n" +
                             "    cal:dtend ?end .\n" +
                             " FILTER (\n" +
                             "  ?start < '2014-04-01'^^xsd:date\n" +
                             "  || ?end >= '2014-05-01'^^xsd:date\n" +
                             " )\n" +
                             "} LIMIT 10"
                },
                {
                    "name": "10 events in April 2014 in the Tennengebirge region",
                    "value": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                        "PREFIX cal: <http://www.w3.org/2002/12/cal#>\n" +
                        "PREFIX lode: <http://linkedevents.org/ontology/>\n" +
                        "PREFIX gn: <http://www.geonames.org/ontology#>\n" +
                        "\n" +
                        "SELECT ?eventName ?start ?end ?placeName WHERE {\n" +
                        "  ?s a <http://schema.org/Event> ;\n" +
                        "      cal:dtstart ?start ;\n" +
                        "      cal:dtend ?end ;\n" +
                        "      rdfs:label ?eventName ;\n" +
                        "      lode:atPlace ?place .\n" +
                        "  ?place gn:parentADM2 <http://rdf.salzburgerland.com/events/place/4d50ce3e-a0f9-4c86-8df2-8124035f2acb> ;\n" +
                        "      rdfs:label ?placeName .\n" +
                        "  FILTER (\n" +
                        "  ?start < '2014-04-01'^^xsd:date\n" +
                        "  || ?end >= '2014-05-01'^^xsd:date\n" +
                    "  )\n" +
                    "} LIMIT 10\n"
                },
                {
                    "name": "10 events in April 2014 in the Tennengau - Dachstein West region",
                    "value": "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                        "PREFIX cal: <http://www.w3.org/2002/12/cal#>\n" +
                        "PREFIX lode: <http://linkedevents.org/ontology/>\n" +
                        "PREFIX gn: <http://www.geonames.org/ontology#>\n" +
                        "\n" +
                        "SELECT ?eventName ?start ?end ?placeName WHERE {\n" +
                        "  ?s a <http://schema.org/Event> ;\n" +
                        "      cal:dtstart ?start ;\n" +
                        "      cal:dtend ?end ;\n" +
                        "      rdfs:label ?eventName ;\n" +
                        "      lode:atPlace ?place .\n" +
                        "  ?place gn:parentADM2 <http://rdf.salzburgerland.com/events/place/f23104b7-fee9-4838-a1e4-ea7732785c7c> ;\n" +
                        "      rdfs:label ?placeName .\n" +
                        "  FILTER (\n" +
                        "  ?start < '2014-04-01'^^xsd:date\n" +
                        "  || ?end >= '2014-05-01'^^xsd:date\n" +
                    "  )\n" +
                    "} LIMIT 10\n"
                }
            ],
            "hints": [
                {"container":"samples","content":"<img width='300px' src='" + SQUEBI.app + "/squebi/img/hint1.png'>","position":2,"dimension":{"width":100,"height":100},"css":"margin-top:-5px;margin-left:-10px"},
                {"container":"query-container","content":"<img width='300px' src='" + SQUEBI.app + "/squebi/img/hint3.png'>","dimension":{"width":100,"height":100},"css":"margin-top:120px;margin-left:-210px"},
                {"container":"writers","content":"<img width='370px' src='" + SQUEBI.app + "/squebi/img/hint2.png'>","dimension":{"width":100,"height":100},"css":"margin-top:-30px;margin-left:-400px","position":2}
            ],
            "namespaces": {
                "http://www.w3.org/2001/XMLSchema#": "xsd",
                "http://www.w3.org/2000/01/rdf-schema#":"rdfs",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#":"rdf",
                "http://www.w3.org/2004/02/skos/core#":"skos",
                "http://xmlns.com/foaf/0.1/":"foaf",
                "http://purl.org/dc/terms/":"dct",
                "http://www.w3.org/ns/ma-ont#":"ma",
                "http://purl.org/dc/elements/1.1/":"dc",
                "http://schema.org/": "schema",
                "http://purl.org/NET/c4dm/event.owl#": "event",
                "http://www.w3.org/2002/12/cal#": "cal",
                "http://www.w3.org/2003/01/geo/wgs84_pos#": "geo",
                "http://www.w3.org/2006/time#": "time",
                "http://open.vocab.org/terms/": "ov",
                "http://www.loa-cnr.it/ontologies/DUL.owl#": "dul",
                "http://www.w3.org/2006/vcard/ns#": "vcard",
                "http://linkedevents.org/ontology/": "lode"
            },
            "updateAllowed": true
        }

        jQuery.extend(defaultConfig, SQUEBI);
        jQuery(SQUEBI.appLoader).hide();
        jQuery(SQUEBI.container).show();
        squebi.constant('SQUEBI', defaultConfig);
        angular.bootstrap(SQUEBI.container, ['Squebi']);

    });
});