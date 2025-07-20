:- module test_ruleset.
:- interface.
:- import_module io.
:- pred main(io::di, io::uo) is det.

:- implementation.
:- import_module io, ruleset, types.

main(!IO) :-
    get_rules(Rules),
    ( if Rules = [_ | _] then
        io.write_string("Rules loaded successfully.\n", !IO)
    else
        io.write_string("No rules found.\n", !IO)
    ).