:- module proof.trace_printer.
:- interface.
:- import_module io, list, string.

:- pred print_inference_trace(list(string)::in, io::di, io::uo) is det.
:- func format_inference_trace(list(string)) = string.

% Optional JSON output for Kotlin UI
:- func trace_to_json(list(string)) = string.

:- implementation.

print_inference_trace(Trace, !IO) :-
    io.write_string("Inference Trace:\n", !IO),
    (
        Trace = [],
        io.write_string("  (Empty trace)\n", !IO)
    ;
        Trace = [Step | Rest],
        io.write_string("  1. " ++ Step ++ "\n", !IO),
        print_rest(Rest, 2, !IO)
    ).

:- pred print_rest(list(string)::in, int::in, io::di, io::uo) is det.
print_rest([], _, !IO).
print_rest([H | T], N, !IO) :-
    io.format("  %d. %s\n", [i(N), s(H)], !IO),
    print_rest(T, N + 1, !IO).

format_inference_trace(Trace) = Output :-
    strings.map((func(Step) = "> " ++ Step), Trace, Indented),
    string.join_list("\n", Indented) = Output.

trace_to_json(Trace) = JSONString :-
    Steps = map(func(S) = "\"" ++ S ++ "\"", Trace),
    string.join_list(", ", Steps) = Inner,
    "[" ++ Inner ++ "]" = JSONString.