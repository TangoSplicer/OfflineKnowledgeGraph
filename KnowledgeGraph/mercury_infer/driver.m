:- module driver.
:- interface.

:- pred run(io::di, io::uo) is det.

:- implementation.

:- import_module io, factbase, ruleset, reasoner, types, scorer, consistency, json.

run(!IO) :-
    io.open_input("facts.txt", Result, !IO),
    (
        Result = ok(Stream),
        json.read_value(Stream, ValueResult, !IO),
        (
            ValueResult = ok(Value),
            Graph = json.get_graph(Value),
            load_facts(Graph, Facts),
            get_rules(Rules),
            audit_graph(Graph, Audit),
            ( if Audit = [] then
                run_inference(Graph, Rules, Result),
                scorer:score(Result, Score),
                io.format("Inference completed with score: %.2f\n", [f(Score)], !IO)
            else
                io.write_string("Graph audit failed:\n", !IO),
                list.foldl((pred(C::in, !.IO::di, !:IO::uo) is det :-
                    io.write_string("  ", !IO),
                    io.write(C, !IO),
                    io.nl(!IO)
                ), Audit, !IO)
            )
        ;
            ValueResult = error(Error),
            io.write_string("JSON parsing failed: ", !IO),
            io.write_string(json.error_message(Error), !IO),
            io.nl(!IO)
        )
    ;
        Result = error(Error),
        io.write_string("Failed to open facts.txt: ", !IO),
        io.write_string(io.error_message(Error), !IO),
        io.nl(!IO)
    ).

load_facts(Graph, Facts) :-
    graph_to_facts(Graph, Facts).

get_rules(Rules) :-
    ruleset.default_rules(Rules).