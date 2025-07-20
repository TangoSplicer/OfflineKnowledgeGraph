:- module debug.
:- interface.

:- import_module types.

:- pred log_facts(string::in, list(fact)::in, io::di, io::uo) is det.

:- implementation.

:- import_module io, list.

log_facts(Label, Facts, !IO) :-
    io.format("%s:\n", [s(Label)], !IO),
    list.foldl((pred(F::in, !.IO::di, !:IO::uo) is det :-
        io.write_string("  -> ", !IO),
        io.write(F, !IO),
        io.nl(!IO)
    ), Facts, !IO).