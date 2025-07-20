% project_root/scripts/run_infer.m
:- module run_infer.
:- interface.
:- import_module io.
:- pred main(io::di, io::uo) is det.

:- implementation.
:- import_module logic_api.

main(!IO) :-
    logic_api:bootstrap(!IO).