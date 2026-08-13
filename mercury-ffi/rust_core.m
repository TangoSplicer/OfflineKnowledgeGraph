:- module rust_core.
:- interface.
:- import_module io.

:- pred main(io::di, io::uo) is det.

:- implementation.

main(!IO) :-
    io.write_string("Mercury FFI bridge stub for OfflineKnowledgeGraph.\n", !IO).
