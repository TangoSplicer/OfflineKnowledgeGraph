:- module cli.reason_cli.
:- interface.
:- import_module io.

:- pred main(io::di, io::uo) is det.

:- implementation.
:- import_module string, list.
:- import_module proof.trace_printer, proof.contradiction_explainer.

main(!IO) :-
    io.write_string("Enter known facts (comma-separated): ", !IO),
    io.read_line_as_string(Result, !IO),
    (
        Result = ok(Line),
        string.words(Line) = Facts,
        ( if Facts = [A, B] then
            Trace = ["Given: " ++ A, "Given: " ++ B, "→ Inference triggered"],
            print_inference_trace(Trace, !IO),
            io.write_string("JSON Trace: ", !IO),
            io.write_string(trace_to_json(Trace) ++ "\n", !IO),
            io.write_string("Contradiction Check:\n", !IO),
            io.write_string(explain_contradiction(A, B) ++ "\n", !IO)
          else
            io.write_string("Please enter exactly two facts.\n", !IO)
        )
    ;
        Result = error(_),
        io.write_string("Error reading input.\n", !IO)
    ).