:- module cli.
:- interface.

:- pred main(io::di, io::uo) is det.

:- implementation.

:- import_module io, string, factbase, ruleset, reasoner, types.

main(!IO) :-
    io.write_string("Mercury Inference CLI\n", !IO),
    load_facts("facts.txt", Facts),
    get_rules(Rules),
    Graph = graph([], []),  % replace with parsed input if needed
    run_inference(Graph, Rules, Result),
    (
        Result = valid(Fs),
        io.format("Valid inference. %d facts:\n", [i(length(Fs))], !IO),
        list.foldl((pred(F::in, !.IO::di, !:IO::uo) is det :-
            io.write_string("  ", !IO),
            io.write(F, !IO),
            io.nl(!IO)
        ), Fs, !IO)
    ;
        Result = invalid(Fs),
        io.write_string("Contradictions detected:\n", !IO),
        list.foldl((pred(F::in, !.IO::di, !:IO::uo) is det :-
            io.write_string("  ", !IO),
            io.write(F, !IO),
            io.nl(!IO)
        ), Fs, !IO)
    ).