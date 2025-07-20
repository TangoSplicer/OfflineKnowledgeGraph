:- module driver.
:- interface.

:- pred run(io::di, io::uo) is det.

:- implementation.

:- import_module io, factbase, ruleset, reasoner, types, scorer, consistency.

run(!IO) :-
    load_facts("facts.txt", Facts),
    get_rules(Rules),
    Graph = graph([], []),  % replace with actual parsing input
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
    ).